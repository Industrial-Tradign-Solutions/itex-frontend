# Guía de diseño — Módulo de Facturación (ITEX)

Este documento resume **todas** las decisiones y el conocimiento acumulado sobre el diseño del módulo de facturación de ITEX (Spring Boot + PostgreSQL). Sirve como contexto para desarrollo asistido por agentes de IA, y como referencia propia para retomar el desarrollo más adelante.

**Índice:**
1. Contexto del negocio
2. Conceptos generales de una factura (a nivel mundial)
3. Decisión de diseño: factura multi-departamento (desacople del PO, control de PO's asociados, importación de charges)
4. Estados de la factura — lista, reglas por estado, reversión `ISSUED → DRAFT` (draft bloqueado), manejo de vencidas (OVERDUE) y su scheduler, diagrama de transiciones
5. Cálculo de totales: DB vs DTO (incluye productos + charges + taxes), precisión decimal y redondeo
6. Lógica de cálculo de `due_at` según `payment_terms`
7. Registro de pagos — tabla, flujo del modal "Registrar pago", anulación
8. Esquema actual de tablas — menú, `t_invoices` (incluyendo ciclo de vida de `total_amount`, `paid_amount`, `due_at`, `is_overdue`, `overdue_notified_at`), `t_invoice_charges`, `t_invoice_taxes` (confirmado, con enum de tipos), `t_invoice_payments`, `t_invoice_ip_products`, `t_invoice_ip_po`, `t_invoice_cloned`, `t_invoice_history`, numeración/consecutivos
9. Notas de crédito (concepto — no evaluado con el cliente)
10. Multi-moneda / tasa de cambio (concepto — no es requerimiento actual)
11. Reporte consolidado por cliente / estado de cuenta (tema por evaluar) + otros puntos evaluados y descartados
12. Permisos / acciones (`t_actions`) + alcance de facturas por vendedor
13. Temas pendientes de definir

## 1. Contexto del negocio

- ITEX gestiona procesos internos de una empresa de importación/comercialización (iTradingSolutions / Industrial Trading Solutions) que consigue productos, materiales y herramientas para clientes y los entrega en su país.
- Actualmente solo existe el departamento **IP (Industrial Procurement / Compras Industriales)**, con los módulos: `Quote Requests → Quotations → Purchase Orders`.
- A futuro se agregarán otros departamentos independientes (Logística, Materias Primas, etc.), cada uno con sus propios módulos y datos.
- Las facturas hoy se generan manualmente en Excel y el PDF se produce a partir de ahí. El sistema completo (QR/Q/PO) no está en uso todavía porque falta construir la facturación.
- No se maneja facturación electrónica ni integración con sistemas externos/fiscales por el momento.

## 2. Conceptos generales de una factura (a nivel mundial)

Toda factura cumple 3 funciones: documento legal de venta, registro contable, e instrucción de cobro. Campos típicos:

**Identificación:** número correlativo único, fecha de emisión, fecha de vencimiento, moneda.

**Partes:** emisor y cliente (nombre, dirección, contacto, identificación fiscal si aplica).

**Origen:** referencia al documento del que nace (Purchase Order u otro origen según el departamento).

**Detalle (line items):** descripción, cantidad, precio unitario, subtotal por línea, impuestos, descuentos.

**Totales:** subtotal, impuestos, descuentos, cargos adicionales (freight, insurance, wire transfer fee, etc.), total, monto pagado, saldo pendiente.

**Condiciones:** términos de pago, método de pago, notas.

**Trazabilidad:** usuario creador, fechas de cada transición de estado, historial.

## 3. Decisión de diseño: factura multi-departamento

La factura debe ser **agnóstica del departamento de origen**, para no acoplarla a IP y poder extenderla a Logística/Materias Primas después sin modificar el core.

**Decisión final (pragmática, sin over-engineering):**
- Una tabla núcleo `t_invoices`, con un campo `department` (ej. `IP`) que identifica el origen.
- **La factura queda funcionalmente desacoplada del Purchase Order.** El PO se usa como atajo de UX al momento de crear la factura (importar/autocompletar productos y cargos desde un PO, Quotation o QR existente), pero los datos importados quedan **copiados** en la factura, no referenciados en vivo.
- Sí se mantiene una **tabla de control/trazabilidad** (`t_invoice_ip_po`) que lista qué PO's están asociados a una factura — esto es solo para fines de visibilidad/reporte ("¿qué PO's componen esta factura?"), no una dependencia funcional: la factura no necesita esa tabla para calcular nada de sí misma. Ver detalle en sección 8.
- Los **productos facturados** se guardan en una tabla propia de IP (`t_invoice_ip_products`), **copiados** al momento de facturar — nunca en vivo desde `t_ip_products` ni desde el PO — así la factura queda inmutable aunque el producto o el PO cambien después.
- Cuando se agregue otro departamento (Logística, etc.), se crean sus propias tablas de productos/detalle/PO-control paralelas, sin tocar `t_invoices`. Solo si el patrón se repite igual entre 2+ departamentos reales, se evalúa abstraerlo — no antes.

**"Other charges" con múltiples PO's (resuelto):** dado que una factura puede consolidar productos de varios PO's, incluso de proveedores distintos, no tiene sentido sumar automáticamente los charges de cada PO (ej. el freight consolidado no es la suma de los freights individuales). La solución: usar el campo `type` que ya existe en `t_invoice_charges` para poder **importar cargos manualmente desde el PO, la Quotation o el QR asociado** (mismo patrón que la importación de productos), quedando como registros independientes y copiados en la factura — sin necesitar una columna de origen, porque una vez importado el charge vive de forma autónoma en la factura.

## 4. Estados de la factura (status)

Lista final definida:

| Estado | Final | Editable | Cómo se alcanza |
|---|---|---|---|
| `DRAFT` | No | Sí, completamente | Al crear la factura, o al revertir desde `ISSUED` |
| `ISSUED` | No | No (solo campos no financieros) | Acción manual "Issue" desde `DRAFT` |
| `PARTIAL_PAID` | No | No | Derivado: suma de pagos > 0 y < total |
| `PAID` | **Sí** | No | Derivado: suma de pagos ≥ total |
| `CANCELLED` | **Sí** | No | Acción manual, desde `DRAFT` o `ISSUED` sin pagos registrados |

Nota: `DRAFT` no es un estado uniforme — una factura que nunca fue emitida (sin `number`) puede eliminarse; una factura que ya fue emitida y luego revertida a `DRAFT` (con `number` ya asignado) queda permanentemente bloqueada para eliminación. Ver detalle en "Reglas por estado".

### Reglas por estado

**`DRAFT`**
- Único estado completamente editable: productos importados (desde PO o manualmente), cliente, cargos.
- Tiene dos variantes según si ya tuvo un `number` asignado o no (ver "Draft bloqueado" más abajo):
  - **Draft nuevo** (`number IS NULL`): solo tiene `draft_number`. Puede eliminarse físicamente (libera su `draft_number` para reuso — ver mecanismo de consecutivos en sección 8).
  - **Draft bloqueado** (`number IS NOT NULL`, viene de una reversión desde `ISSUED`): **no puede eliminarse nunca**, aunque el usuario tenga el permiso `Delete Invoices` — el botón de borrar debe quedar deshabilitado en la UI. Sí es completamente editable igual que un draft nuevo.
- Validaciones para pasar a `ISSUED`: ≥1 producto, totales cuadrados, cliente completo.

**`ISSUED`**
- Si viene de un draft nuevo: se asigna el número correlativo definitivo (`number`, tomado del consecutivo `FINAL`) y se genera el PDF final.
- Si viene de un draft bloqueado (reversión previa): **no se solicita un `number` nuevo** — conserva el que ya tenía asignado. Sí se **recalculan** `issued_at` (fecha de emisión) y `due_at` (fecha de vencimiento, según `payment_terms` vigente al momento de re-emitir).
- Contenido financiero **inmutable** desde este punto (productos, montos). Errores se corrigen anulando (`CANCELLED`), revirtiendo a `DRAFT` (ver abajo), o vía nota de crédito si ya hubo pagos.
- **Campos editables en `ISSUED`** — el `PUT /sales/invoice/{id}` sigue aceptándose, pero solo aplica estos cinco:

  | Campo | Por qué |
  |---|---|
  | `internal_remarks` | Nota interna, no sale en el documento |
  | `remarks` | Observaciones al cliente |
  | `order_number` | Referencia de la orden del cliente, suele llegar después de emitir |
  | `awb_bl` | Guía aérea / BL, se conoce al despachar |
  | `packing_list` | Se arma al empacar |

  Cualquier otro campo del encabezado (cliente, contacto, términos de pago, moneda, incoterms, vía, departamento, sales rep, bloque ship-to) se **rechaza nombrando el campo** (`sales.invoice.issued-restricted-field`). El frontend reenvía los valores actuales sin problema: solo falla un cambio real. Los line items (productos, cargos, impuestos) siguen bloqueados por completo fuera de `DRAFT`.

**`ISSUED → DRAFT`** (reversión, permiso `Revert Invoice to Draft`)
- Permite corregir una factura ya emitida sin necesidad de cancelarla y crear una nueva.
- El `number` (FINAL) que ya tenía asignado **queda reservado para siempre en esa factura** — nunca se libera al pool de consecutivos, nunca se reutiliza en otra factura. Por eso, una vez que una factura tuvo un `number`, queda marcada como "draft bloqueado" (ver arriba) y no podrá eliminarse jamás, aunque vuelva a `DRAFT` las veces que sea necesario.
- Al revertir, mostrar al usuario un mensaje explícito de que la factura ya no podrá eliminarse (porque el número ya quedó tomado).
- La factura vuelve a ser completamente editable (cliente, productos, cargos, etc.).
- Se recomienda: invalidar/eliminar el `path_pdf` generado previamente (ya no corresponde al contenido actual), y registrar el evento en `t_invoice_history` con motivo.
- Restricción: al igual que `CANCELLED`, esta transición **no debería permitirse si la factura ya tiene pagos registrados** — revertir a `DRAFT` una factura con dinero real asociado no tiene sentido; en ese caso el camino es nota de crédito. En la práctica esta restricción es en parte redundante con el `status`: si ya existe un pago, la factura ya habría avanzado a `PARTIAL_PAID` o `PAID`, y la transición `ISSUED → DRAFT` solo se definió como válida partiendo desde `ISSUED`. Aun así, conviene implementarla como una validación explícita en el servicio (comprobar que no existan pagos no anulados en `t_invoice_payments` para esa factura) en vez de confiar únicamente en el valor de `status` — es una salvaguarda barata que evita errores si en el futuro cambia la lógica de transición de estados.
- Al volver a emitir (`DRAFT → ISSUED`) esta factura, sigue la regla ya descrita arriba: reutiliza el mismo `number`, recalcula `issued_at`/`due_at`.

**`PARTIAL_PAID`** (derivado, no manual)
- `suma(pagos) > 0` y `< total_amount`.
- Se apoya en la tabla de pagos `t_invoice_payments` para registrar cada abono (ver sección 7).

**`PAID`** (derivado, no manual)
- `suma(pagos) ≥ total_amount`. Estado prácticamente final.

**`CANCELLED`**
- Alcanzable desde `DRAFT` (sin restricciones) o `ISSUED` (solo si no tiene pagos registrados).
- Requiere motivo de cancelación obligatorio (`cancel_reason`).
- Nunca se borra físicamente (a diferencia de un draft nuevo, sin `number`); queda para auditoría.

### Manejo de "vencida" (OVERDUE)

**Decisión:** `OVERDUE` **no es un valor del campo `status`**. Se maneja como una bandera/flag calculada, separada del ciclo de vida transaccional de la factura.

**Por qué no debe ser un status:** si se sobrescribiera `status = 'OVERDUE'`, se pierde información — una factura vencida puede estar sin ningún pago (`ISSUED` vencido) o con pago parcial (`PARTIAL_PAID` vencido), y esa distinción es necesaria para la lógica de negocio (monto adeudado, mensaje de notificación, qué pasa cuando llega un pago). Habría que guardar el status anterior en otro lado de todas formas, así que es más simple dejarlo aparte desde el inicio.

**Diseño recomendado:** dos columnas adicionales en `t_invoices`, mantenidas por un job programado (scheduler):

```sql
ALTER TABLE t_invoices ADD COLUMN is_overdue BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE t_invoices ADD COLUMN overdue_notified_at TIMESTAMP;
```

- **`is_overdue`**: actualizada por un job diario. Regla: `due_at < now() AND status IN ('ISSUED', 'PARTIAL_PAID')` → `true`. Permite filtrar/ordenar facturas vencidas en listados sin comparar fechas en cada query (mismo motivo por el que se decidió persistir `paid_amount` como snapshot — ver sección 5).
- **`overdue_notified_at`**: para que el scheduler sepa si ya notificó esa factura y no repita la alerta en cada corrida.

**Regla de notificación (definida, implementada):** el destinatario siempre es el **sales rep** de la factura.

1. **Primer aviso** — job diario a las 23:58: notifica las facturas con `is_overdue = true` y `overdue_notified_at IS NULL`, es decir, las que acaban de vencerse, y sella el campo.
2. **Recordatorio semanal** — job de los **lunes a las 9:00 AM**: re-notifica **todas** las que sigan con `is_overdue = true`, sin importar si ya se avisó antes, y actualiza `overdue_notified_at`.
3. Cuando la factura se paga, el job diario apaga `is_overdue` (o lo hace directamente el registro del pago al llegar a `PAID`) y deja de reportarse. Lo mismo si se cancela o se revierte a borrador.

**Marca de pago fuera de tiempo:** apagar `is_overdue` al cobrar borraría el hecho de que la factura se pagó tarde, que es justo lo que interesa para evaluar a un cliente. No se agrega columna: se **deriva** como `paid_at > due_at` y se expone como `paidLate` en las respuestas de detalle y de listado. Ambas fechas sobreviven al pago, así que el dato ya está en la fila.

**Lógica del scheduler (conceptual):**

```sql
SELECT * FROM t_invoices
WHERE due_at < now()
  AND status IN ('ISSUED', 'PARTIAL_PAID')
  AND overdue_notified_at IS NULL   -- o la regla de reintento que se defina
```

**Al registrar un pago sobre una factura vencida:** el `status` avanza normalmente a `PARTIAL_PAID`/`PAID` por la lógica ya definida; en la siguiente corrida del job, `is_overdue` se recalcula a `false` automáticamente (porque `status` ya no cumple la condición, o explícitamente si `status = 'PAID'`).

### Diagrama de transiciones válidas

```
DRAFT ──► ISSUED ──► PARTIAL_PAID ──► PAID   (final)
  ▲          │
  │          │  (revertir, sin pagos registrados —
  └──────────┘   number queda reservado permanentemente)
  │          │
  ▼          ▼
CANCELLED  CANCELLED   (final, ambos; ISSUED solo si no tiene pagos)
```

**Regla de implementación recomendada:** centralizar todas las transiciones en un único servicio (ej. `InvoiceStatusService.transition(invoice, newStatus)`) que valide las precondiciones de la tabla anterior, en vez de permitir que cualquier endpoint modifique el campo `status` directamente.

## 5. Cálculo de totales: DB vs DTO

Principio general: el DTO/servicio es la fuente de verdad para exponer cálculos al API, no la base de datos — evita desincronización.

**Excepción práctica:** para listados/dashboards con filtros u ordenamiento (ej. `GET /invoices?status=OVERDUE&balance>0`), recalcular en memoria para cada request es costoso a medida que crece el volumen.

**Recomendación intermedia:** no persistir todo, solo los agregados que se usan en `WHERE`/`ORDER BY` de listados:
- `total_amount` — snapshot fijado al pasar a `ISSUED` (antes de eso, en `DRAFT`, se calcula al vuelo).
- `paid_amount` — casi obligatorio persistirlo: se usa para determinar el status, calcular `OVERDUE`, y mostrarlo en listados.
- `subtotal` y desgloses — se dejan fuera de la tabla; los arma el DTO desde `t_invoice_ip_products`, `t_invoice_charges` y `t_invoice_taxes` solo cuando se consulta el detalle.

**Fórmula de `total_amount`:** `SUM(productos) + SUM(charges) + SUM(taxes)`, donde `SUM(productos) = SUM(quantity * unit_price)` de `t_invoice_ip_products`, `SUM(charges) = SUM(value)` de `t_invoice_charges`, y `SUM(taxes) = SUM(value)` de `t_invoice_taxes` (ver sección 8 para el detalle de la tabla de impuestos). Si algún impuesto usa como base gravable el subtotal de productos y/o charges, ese impuesto se recalcula primero, antes del total final.

### Precisión decimal y redondeo

Decisión confirmada: **todos los montos se manejan internamente con 5 decimales** (consistente con `unit_price NUMERIC(15,5)` en `t_invoice_ip_products`), para mayor precisión en los cálculos intermedios (cantidad × precio unitario, sumas de líneas, etc.). El **redondeo a 2 decimales ocurre únicamente al momento de generar el PDF** — es decir, es una responsabilidad de presentación, no de cálculo. La base de datos y los cálculos internos nunca truncan a 2 decimales antes de ese punto, evitando el problema clásico de que el PDF y la base de datos muestren totales ligeramente distintos por redondeos acumulados en distintos momentos.

## 6. Lógica de cálculo de `due_at` según `payment_terms`

`due_at` se calcula **una sola vez, al momento de pasar la factura a `ISSUED`**, a partir de `issued_at` y el `payment_terms` seleccionado, y queda persistido (no se recalcula después). Los 30 valores del enum `payment_terms` se agrupan en 4 categorías según la fórmula que aplica:

**Grupo 1 — NET_X (offset simple de días):** `due_at = issued_at + X días`.
Aplica a: NET_5, NET_7, NET_8, NET_10, NET_14, NET_15, NET_20, NET_21, NET_30, NET_35, NET_40, NET_45, NET_55, NET_60, NET_75, NET_90, NET_120, NET_150, NET_180.
Recomendación: guardar el número de días como dato del enum, no parsearlo del string.

**Grupo 2 — "Nth PROX" (día fijo del mes siguiente):** vence el día N del mes **siguiente** al de emisión, sin importar el día de emisión.
Aplica a: NET_15TH_PROX, NET_20TH_PROX, NET_30TH_PROX.
`due_at = issuedAt.plusMonths(1).withDayOfMonth(N)` — con manejo de meses cortos (ej. febrero no tiene día 30, usar el último día del mes en ese caso).

**Grupo 3 — "END OF THE MONTH" (fin de mes + días):** primero se lleva la fecha al último día del mes de emisión, luego se suman los días.
Aplica a: NET_30_END_OF_THE_MONTH, NET_60_END_OF_THE_MONTH.
`due_at = issuedAt.with(TemporalAdjusters.lastDayOfMonth()).plusDays(X)`.
⚠️ No confundir con NET_X normal — la diferencia puede ser de casi un mes.

**Grupo 4 — Términos especiales (no siguen la fórmula de días):**

| Término | Tratamiento |
|---|---|
| `DUE_UPON_RECEIPT` | `due_at = issued_at` (0 días) |
| `COD` | `due_at` = fecha estimada de entrega, o `issued_at` si no se tiene |
| `ADVANCED` | Condición de flujo (debe pagarse antes de procesar), no un plazo posterior a emisión |
| `PRIOR_TO_SHIPMENT` | Condición de flujo (debe pagarse antes de despachar) |
| `W_DOCUMENTS` | Depende de cuándo se entregan documentos de embarque; no calculable solo desde `issued_at` |
| `TO_BE_AGREED` | `due_at = NULL`; no cuenta para el cálculo de `OVERDUE` hasta fijarse manualmente |

Recomendación: agregar un flag `isCalculable` en el enum para diferenciar los términos que sí permiten calcular `due_at` automáticamente de los que no.

## 7. Registro de pagos

### Tabla `t_invoice_payments`

```sql
CREATE TABLE t_invoice_payments (
    id                      UUID            NOT NULL    PRIMARY KEY,
    invoice_id              UUID            NOT NULL    REFERENCES t_invoices(id),
    amount                  NUMERIC(15, 5)  NOT NULL,
    payment_date            DATE            NOT NULL,
    payment_method          VARCHAR(40)     NOT NULL,
    receipt_path            VARCHAR(1000)   NOT NULL,
    receipt_original_name   VARCHAR(255)    NOT NULL,
    notes                   TEXT,
    is_voided               BOOLEAN         NOT NULL    DEFAULT false,
    voided_reason           TEXT,
    voided_at               TIMESTAMP,
    voided_by_user_id       UUID                        REFERENCES t_users(id),
    registered_by_user_id   UUID            NOT NULL    REFERENCES t_users(id),
    created_at              TIMESTAMP       NOT NULL
);
```

**Decisiones clave del modelo:**

- **`amount`** — el valor de ESE abono específico, no el saldo total ni el total de la factura. Una factura puede tener N registros en esta tabla; la suma de todos los no anulados es el `paid_amount` de la factura.
- **`payment_method`** — se guarda como `VARCHAR` en base de datos, mapeado a un enum en el backend (mismo patrón que `payment_terms` en `t_invoices`). No requiere tabla catálogo aparte por ahora.
- **`receipt_path` obligatorio** — cada pago debe llevar su comprobante (imagen o PDF). Mismo patrón que `path_pdf` en `t_invoices`, pero aquí es obligatorio: sin comprobante no debería poder registrarse el pago. `receipt_original_name` guarda el nombre original del archivo subido, para mostrarlo tal cual en la UI.
- **Los pagos son inmutables, no editables ni borrables** — si se registró mal, se **anula** (`is_voided = true` + `voided_reason` obligatorio) y se crea un nuevo registro correcto. Mismo principio que con la factura `ISSUED`: un movimiento financiero ya registrado no se edita, se corrige con una anulación trazable (auditoría: quién anuló, cuándo, por qué).
- **`registered_by_user_id`** — quién lo registró (permiso `Register Payment Invoices`).

### Flujo de UI: botón "Registrar pago"

**1. Habilitación del botón**
Visible/habilitado solo si `invoice.status IN ('ISSUED', 'PARTIAL_PAID')`. No aplica en `DRAFT` (nada que cobrar todavía) ni en `PAID`/`CANCELLED`.

**2. Datos que muestra el modal (contexto, no editable)**
- Total de la factura
- Total ya pagado a la fecha (suma de pagos no anulados)
- Saldo pendiente (el dato más relevante antes de registrar)

**3. Campos que pide el modal**
- Monto del pago — sugerido: prellenar con el saldo pendiente completo (para que el caso más común, pago total, sea de un click), pero editable; si el usuario lo reduce, queda como pago parcial.
- Fecha de pago
- Método de pago (`payment_method`, select desde el enum)
- Comprobante (imagen o PDF) — obligatorio
- Notas (opcional) — referencia bancaria, etc.

**4. Validaciones al enviar**
- `amount > 0`
- `amount <= saldo_pendiente` — no permitir sobre-pago por defecto (evita saldo negativo sin sentido). Si negocio define casos de anticipos a cuenta de facturas futuras, es una regla a agregar después, no en la v1.
- Comprobante obligatorio, con tipo de archivo válido (imagen o PDF).

**5. Qué pasa al guardar (transacción atómica)**
1. Insertar el registro en `t_invoice_payments`.
2. Recalcular `paid_amount` = suma de pagos no anulados de esa factura.
3. Recalcular saldo = `total_amount - paid_amount`.
4. Determinar el nuevo `status`:
   - Si `saldo == 0` → `status = 'PAID'`, `paid_at = now()`.
   - Si `saldo > 0` → `status = 'PARTIAL_PAID'`, `partial_paid_at = now()` **solo la primera vez** que entra a este estado (no sobrescribir en cada abono adicional — esa fecha representa "cuándo empezó a estar parcialmente pagada", no el último abono).
5. Si `status` pasa a `PAID`, recalcular `is_overdue = false` (ya no debe seguir marcada como vencida, sin importar la fecha).

**6. Anulación de un pago (caso de error)**
- Requiere el permiso `Void Payment Invoices`.
- Al anular: se marca `is_voided = true`, `voided_reason` (obligatorio), `voided_at` y `voided_by_user_id` en `t_invoice_payments`; se recalcula `paid_amount` excluyendo ese registro; y el `status` de la factura se re-evalúa hacia atrás (`PAID → PARTIAL_PAID`, o `PARTIAL_PAID → ISSUED` si el saldo vuelve a ser igual al total).

## 8. Esquema actual de tablas (real, en implementación)

### Menú

```sql
INSERT INTO t_menus (id, created_at, is_active, description, icon, name, url, main_menu_id, is_main_option, position, docs_url)
VALUES (
    5000, now(), true, 'Systems Sales Category Sales', '', 'Sales', '/p/sales', null, TRUE, 2, null
);

INSERT INTO t_menus (id, created_at, is_active, description, icon, name, url, main_menu_id, is_main_option, position, docs_url)
VALUES (
    5001, now(), true, 'Industrial Purchase Invoices', 'pi pi-receipt', 'Invoices', '/p/sales/inv', 5000, FALSE, 1, null
);

/* Acciones módulo Invoices — ver sección 9 para el detalle completo */
```

### `t_invoices`

```sql
CREATE TABLE t_invoices (
    id                      UUID            NOT NULL    PRIMARY KEY,
    draft_number            BIGINT          NOT NULL    CONSTRAINT ip_invoice_unique_draft_number UNIQUE,
    number                  BIGINT                      CONSTRAINT ip_invoice_unique_number UNIQUE,
    department              VARCHAR(3)      NOT NULL    DEFAULT 'IP',
    status                  VARCHAR(20)     NOT NULL    DEFAULT 'DRAFT',
    currency                VARCHAR(20)     NOT NULL,
    client_id               UUID            NOT NULL    REFERENCES t_clients(id),
    client_contact_id       UUID            NOT NULL    REFERENCES t_clients_contacts(id),
    ship_to_name            VARCHAR(300)    NOT NULL,
    ship_to_address         VARCHAR(500)    NOT NULL,
    ship_to_city            UUID            NOT NULL    REFERENCES t_cities(id),
    ship_to_phone           VARCHAR(20)     NOT NULL,
    ship_to_contact_name    VARCHAR(50)     NOT NULL,
    ship_to_email           VARCHAR(100)    NOT NULL,
    order_number            VARCHAR(100),
    via                     VARCHAR(10),
    incoterms               VARCHAR(20)     NOT NULL,
    payment_terms           VARCHAR(40),
    awb_bl                  VARCHAR(100),
    sales_rep_id            uuid            not null    references t_users,
    remarks                 TEXT,
    internal_remarks        TEXT,
    packing_list            VARCHAR(100),

    total_amount            NUMERIC(15, 5)  NOT NULL    DEFAULT 0,
    paid_amount             NUMERIC(15, 5)  NOT NULL    DEFAULT 0,

    due_at                  TIMESTAMP,
    is_overdue              BOOLEAN         NOT NULL    DEFAULT false,
    overdue_notified_at     TIMESTAMP,

    issued_at               TIMESTAMP,
    partial_paid_at         TIMESTAMP,
    paid_at                 TIMESTAMP,
    cancelled_at            TIMESTAMP,
    cancel_reason           TEXT,

    created_at              TIMESTAMP       NOT NULL,
    path_pdf                VARCHAR(1000),
    open_at                 TIMESTAMP,
    open_by_user_id         UUID                        REFERENCES t_users(id)
);
```

**`path_pdf` — solo documentos oficiales.** La factura tiene dos formas de imprimirse: en `DRAFT` cada `print` **regenera** el PDF con los datos del momento y **no** toca `path_pdf`, porque es una vista previa de algo que todavía se está editando; al emitir se genera el documento definitivo y ahí sí se persiste la ruta. De esa forma `path_pdf IS NOT NULL` equivale a "esta factura ya fue emitida". Los archivos viven bajo `{data}/{año}/{mes}/{departamento}/INV/`, con el mismo layout que los PDF de QR/Q/PO, y el nombre es el número con ceros a la izquierda (`001000.pdf`; el borrador usa su `draft_number`). Al revertir a `DRAFT` el campo se limpia, porque el PDF previo ya no corresponde al contenido.

**Índices.** PostgreSQL solo crea índice automático para PK y UNIQUE — **no** para las claves foráneas. La auditoría del módulo (pre-producción) agregó a `V2.0.2` los que sostienen las consultas reales: `client_id`, `sales_rep_id`, `status` y `created_at DESC` para el listado con su alcance por vendedor y su orden por defecto; parciales sobre `open_by_user_id`, `is_overdue` y `due_at` para los locks y el scheduler de vencidas (parciales porque solo interesa una fracción mínima de la tabla); y `invoice_id` en `t_invoice_payments`, `t_invoice_charges` y `t_invoice_taxes`, que es como se leen siempre. `t_invoice_ip_products` y `t_invoice_ip_po` ya quedaban cubiertos por su PK/UNIQUE con `invoice_id` como primera columna.

Notas sobre campos respecto a versiones anteriores de este documento:
- `draft_number` (obligatorio, único) vs `number` (opcional hasta emitir, único cuando existe) — separa el número de borrador del número oficial. Ver más abajo el mecanismo de consecutivos.
- `total_amount` y `paid_amount` ya persistidos como snapshot, tal como se definió en la sección 5.
- `due_at` y `cancel_reason` ya incluidos, tal como se definió en las secciones 4 y 6.
- `is_overdue` y `overdue_notified_at` ya incluidos (sección 4, manejo de OVERDUE) — esquema completo, sin pendientes en `t_invoices`.
- `updated_at` — decisión final: no se agrega, cubierto por `t_invoice_history`.

### Ciclo de vida de los campos calculados: `total_amount`, `paid_amount`, `due_at`, `is_overdue`, `overdue_notified_at`

Estos 5 campos no se llenan una sola vez — cada uno se recalcula en momentos distintos del ciclo de vida de la factura. Se consolida aquí toda la lógica (ya mencionada de forma dispersa en las secciones 4, 5, 6 y 7) en un solo lugar de referencia:

| Campo | En `DRAFT` (nuevo o revertido) | Al pasar a `ISSUED` (o re-emitir) | Con pagos (`t_invoice_payments`) | Por el scheduler diario |
|---|---|---|---|---|
| `total_amount` | Se recalcula **al vuelo** cada vez que se agrega/edita/quita un producto (`t_invoice_ip_products`), un cargo (`t_invoice_charges`) o un impuesto (`t_invoice_taxes`): `SUM(quantity * unit_price)` de productos + `SUM(value)` de charges + `SUM(value)` de taxes. No es necesario persistirlo mientras está en `DRAFT` — o si se persiste por conveniencia de UI, se sobrescribe libremente. Importante: si algún impuesto usa como `taxable_base` el subtotal de productos + ciertos charges, ese impuesto debe recalcularse primero cada vez que cambien productos/charges, antes de recalcular el `total_amount` final — el orden de cálculo importa. | Queda **congelado** con el último valor calculado al momento de emitir. No vuelve a cambiar mientras la factura permanezca en `ISSUED`/`PARTIAL_PAID`/`PAID`. | No lo modifican. | No lo toca. |
| `paid_amount` | Debe estar en `0` — no deberían existir pagos sobre una factura en `DRAFT` (el botón "Registrar pago" solo se habilita en `ISSUED`/`PARTIAL_PAID`, sección 7). Si la factura viene de una reversión, ya se validó que no tuviera pagos antes de permitir la reversión (sección 4), así que sigue en `0`. | No se toca directamente por la emisión; sigue reflejando la suma de pagos no anulados (normalmente `0` en una emisión nueva). | Se **recalcula** en cada registro o anulación de pago: `SUM(amount)` de `t_invoice_payments` donde `is_voided = false` para esa factura (sección 7, pasos 1-2, y anulación). | No lo toca. |
| `due_at` | `NULL` mientras no se ha emitido. Si la factura fue revertida desde `ISSUED`, se recomienda limpiarlo a `NULL` de nuevo (ya no aplica un vencimiento sobre un documento que ya no es oficial), y se vuelve a calcular al re-emitir. | Se **calcula y persiste** a partir de `issued_at` + `payment_terms`, según las fórmulas de la sección 6. Si es una re-emisión (factura revertida que ya tenía `number`), se **recalcula igual** con la fecha de re-emisión actual — no se conserva el `due_at` anterior. | No lo modifican. | No lo toca (solo lo lee para calcular `is_overdue`). |
| `is_overdue` | Debe quedar en `false` al revertir a `DRAFT` (ya que `due_at` se limpia y la factura deja de estar "vencible" mientras no esté emitida). | Queda en `false` al emitir/re-emitir (el nuevo `due_at` normalmente es una fecha futura). | Se recalcula indirectamente: al llegar a `PAID`, se fuerza a `false` (sección 4 y 7, paso 5) sin esperar a la siguiente corrida del scheduler. | Job diario: `true` si `due_at < now() AND status IN ('ISSUED', 'PARTIAL_PAID')`; en caso contrario, `false` (sección 4). |
| `overdue_notified_at` | Se recomienda limpiarlo a `NULL` al revertir a `DRAFT` (para que, si la factura vuelve a vencer tras re-emitirse, el scheduler pueda notificar de nuevo). | `NULL` al emitir/re-emitir. | No lo modifican directamente, salvo que al llegar a `PAID` conviene limpiarlo también a `NULL` junto con `is_overdue`, para dejar el campo listo por si la factura reabre algún flujo futuro. | Se **setea** con la fecha/hora de la corrida cuando se envía la notificación de vencimiento (sección 4). Queda como referencia para no repetir el envío (o para la regla de reintento que se defina). |

**Regla de implementación recomendada:** igual que con las transiciones de `status`, conviene que `total_amount` y `paid_amount` se recalculen dentro de un único punto del servicio (ej. `InvoiceCalculationService.recalculateTotals(invoice)`) que se invoque después de cualquier cambio en productos, cargos o pagos, en vez de que cada endpoint actualice estos campos por su cuenta — reduce el riesgo de que un flujo se le olvide recalcular y quede desincronizado.

### `t_invoice_charges`

```sql
CREATE TABLE t_invoice_charges (
    id                      UUID            NOT NULL    PRIMARY KEY,
    invoice_id              UUID            NOT NULL    REFERENCES t_invoices,
    description             VARCHAR(100)    NOT NULL,
    type                    VARCHAR(100)    NOT NULL,
    value                   NUMERIC(15, 5)  NOT NULL,
    created_at              TIMESTAMP       NOT NULL
);
```

Soporta la importación de cargos desde PO, Quotation o QR (ver sección 3): al importar, se crea un registro nuevo copiado en esta tabla, usando `type` para clasificar el cargo (freight, insurance, other, etc.). No requiere columna de origen — una vez importado, el cargo es autónomo de la factura.

**Listado de referencia para el enum `type` de charges:**

```
INTERNATIONAL_FREIGHT       -- flete internacional (origen a país destino)
LOCAL_FREIGHT                -- flete local/consolidación (ej. "freight to Miami")
INSURANCE                    -- seguro de la mercancía
WIRE_TRANSFER_FEE            -- comisión por transferencia bancaria
CUSTOMS_DUTIES                -- aranceles/derechos de aduana
CUSTOMS_BROKERAGE_FEE         -- honorarios del agente aduanal
HANDLING_FEE                  -- manejo de carga
PACKING_FEE                   -- empaque especial
STORAGE_FEE                   -- almacenaje/bodegaje
INSPECTION_FEE                -- inspección de mercancía
BANK_FEE                      -- otras comisiones bancarias
DISCOUNT                      -- descuento (valor negativo o restado según implementación)
OTHER                         -- cualquier cargo no catalogado
```

### `t_invoice_taxes` — impuestos (confirmado, en implementación)

**Decisión confirmada:** los impuestos sí se van a implementar — son importantes por la operación con clientes en Colombia y otros países. Funcionalmente son similares a `t_invoice_charges` (múltiples registros por factura, cada uno con su `type`), con la diferencia clave de que un impuesto se calcula como **porcentaje sobre una base gravable**, no como un monto fijo — por eso va en tabla separada, para poder guardar `rate` y `taxable_base` y no perder esa trazabilidad (útil si cambia la tasa en el futuro y se necesita saber qué tasa se aplicó en una factura vieja).

```sql
CREATE TABLE t_invoice_taxes (
    id                  UUID            NOT NULL    PRIMARY KEY,
    invoice_id          UUID            NOT NULL    REFERENCES t_invoices,
    type                VARCHAR(30)     NOT NULL,   -- ver enum de referencia abajo
    description         VARCHAR(100)    NOT NULL,   -- ej. "Colombia VAT", "US Sales Tax NY"
    rate                NUMERIC(5, 4)   NOT NULL,   -- ej. 0.1900 para 19%
    taxable_base        NUMERIC(15, 5)  NOT NULL,   -- monto sobre el que se calculó (subtotal, u otro)
    value               NUMERIC(15, 5)  NOT NULL,   -- rate * taxable_base, persistido
    created_at          TIMESTAMP       NOT NULL
);
```

**Listado de referencia para el enum `type` de impuestos:**

```
US_SALES_TAX          -- impuesto sobre ventas, EE.UU. (varía por estado)
COLOMBIA_IVA           -- IVA Colombia
WITHHOLDING_TAX        -- retención en la fuente (común que clientes colombianos retengan un % del pago)
VAT                    -- IVA genérico para otros países (España, UE, etc.)
GST                    -- impuesto tipo GST (ej. Australia, Canadá, India)
EXPORT_TAX_EXEMPT      -- exportación exenta (tasa 0%, se deja registrado explícitamente el motivo)
OTHER                  -- cualquier impuesto no catalogado
```

Nota importante sobre `WITHHOLDING_TAX`: en Colombia es común que el cliente retenga un % del pago (retención en la fuente) y pague menos de lo facturado, entregando un certificado de retención en vez del monto completo. Esto es distinto de un impuesto que se cobra en la factura — es un descuento en el pago recibido, no un cargo adicional. Si este caso aplica, afecta directamente cómo se concilia `paid_amount` contra `total_amount` (el cliente puede considerar que "pagó completo" según su registro, pero se recibe menos, sin que sea un error). Queda como pregunta de negocio a confirmar (ver sección 13).

**Impacto en `total_amount`:** al confirmarse los impuestos, el cálculo de `total_amount` (sección 5) pasa a ser: `SUM(productos) + SUM(charges) + SUM(taxes)`. Ver la nota actualizada en la sección 5.

**Preguntas de negocio aún abiertas antes de terminar de implementar** (ver también sección 13): ¿los impuestos se determinan automáticamente por el país del `ship_to_city`/cliente, o el usuario los agrega manualmente al facturar? ¿la base gravable (`taxable_base`) incluye solo productos, o también algunos charges (ej. freight)? ¿hay casos de exención que deban quedar registrados explícitamente (`EXPORT_TAX_EXEMPT`)?

### `t_invoice_ip_po` — control/trazabilidad de PO's asociados

```sql
CREATE TABLE t_invoice_ip_po (
    invoice_id              UUID            NOT NULL    REFERENCES t_invoices,
    ip_po_id                UUID            NOT NULL    REFERENCES t_ip_purchase_orders,
    PRIMARY KEY (invoice_id, ip_po_id)
);
```

Solo de control/visibilidad — permite responder "¿qué PO's componen esta factura?" sin que la factura dependa funcionalmente de esta tabla para ningún cálculo (productos y charges ya están copiados en sus propias tablas). Coherente con el desacople funcional definido en la sección 3.

### `t_invoice_payments`

Ver definición completa y lógica de uso en la sección 7. Nombre de tabla ya ajustado (antes `t_invoices_payments`).

### `t_invoice_ip_products` — productos facturados (esquema final)

Decisión confirmada: **la factura queda totalmente desacoplada del Purchase Order.** El PO solo se usa como atajo de UX al crear la factura (importar/autocompletar productos desde un PO existente); no se persiste ninguna referencia hacia el PO en la factura.

```sql
CREATE TABLE t_invoice_ip_products(
    id                      UUID            NOT NULL    PRIMARY KEY,
    invoice_id              UUID            NOT NULL    REFERENCES t_invoices,
    product_id              uuid            NOT NULL    REFERENCES t_ip_products,
    number                  int             not null    DEFAULT 1,
    quantity                NUMERIC(15, 5)  NOT NULL    DEFAULT 0,
    unit_type               VARCHAR(50)     NOT NULL,
    lead_time               INT             NOT NULL    DEFAULT 0,
    lead_time_type          VARCHAR(10)     NOT NULL    DEFAULT 'WEEKS',
    unit_price              NUMERIC(15,5)   NOT NULL    DEFAULT 0,
    profit_margin           NUMERIC(3,2)    NOT NULL    DEFAULT 0,
    condition               VARCHAR(20)     NOT NULL,
    created_at              TIMESTAMP       NOT NULL
);

ALTER TABLE t_invoice_ip_products
    ADD CONSTRAINT inv_product_unique
        UNIQUE (invoice_id, product_id);
```

Notas sobre este esquema final (respecto a la versión inicial que solo tenía `product_id`):
- Ya cumple el principio de inmutabilidad: `quantity`, `unit_price`, `unit_type`, `lead_time`, `profit_margin` y `condition` quedan copiados al momento de facturar, no se leen en vivo desde `t_ip_products`.
- `product_id` se mantiene como referencia para trazabilidad/reportes — no es un dato financiero, así que no rompe la inmutabilidad.
- `number` — número de línea/orden del producto dentro de la factura (para mantener el orden de despliegue en el PDF).
- `lead_time` + `lead_time_type` — tiempo estimado de entrega del producto, replicando información relevante que probablemente ya se maneja en Quotations/PO.
- `profit_margin` — margen de ganancia asociado al producto en esa factura específica.
- `condition` — condición del producto (ej. nuevo/usado, o el estado que maneje el catálogo de IP).
- No incluye `subtotal` ni `description` explícitos — el subtotal por línea se calcularía como `quantity * unit_price` en el DTO (consistente con el principio de la sección 5: cálculos derivados se arman en el DTO, no se duplican en la tabla salvo que se necesiten para filtros/listados, lo cual no aplica a nivel de línea de producto).
- Constraint `UNIQUE (invoice_id, product_id)`: un mismo producto no puede aparecer dos veces como filas separadas en la misma factura. Si llegara a necesitarse facturar el mismo producto en más de un "lote" con distinto precio dentro de la misma factura, esta constraint habría que revisarla — por ahora se mantiene tal como se definió.

### `t_invoice_cloned` — trazabilidad de clonación

```sql
CREATE TABLE t_invoice_cloned (
    main_invoice_id              uuid            not null    references t_invoices,
    clone_invoice_id             uuid            not null    references t_invoices,
    primary key (main_invoice_id, clone_invoice_id)
);

ALTER TABLE t_invoice_cloned
    ADD CONSTRAINT invoice_clone_unique_id
        UNIQUE (clone_invoice_id);
```

Soporta el permiso `Clone Invoices` ya definido. Registra la relación entre la factura original (`main_invoice_id`) y la factura clonada (`clone_invoice_id`). La constraint `UNIQUE (clone_invoice_id)` asegura que una factura clonada solo pueda tener un único origen (no puede ser clon de más de una factura a la vez), pero una misma factura sí puede ser el origen de múltiples clones.

### `t_invoice_history` — auditoría genérica

```sql
CREATE TABLE t_invoice_history (
    id                      uuid            NOT NULL    PRIMARY KEY,
    invoice_id              uuid            NOT NULL    REFERENCES t_invoices,
    user_id                 uuid            NOT NULL    REFERENCES t_users,
    action                  varchar(50)     NOT NULL,
    created_at              timestamp       NOT NULL,
    data                    json
);
```

Tabla de auditoría genérica: un registro por evento relevante (transición de status, edición en `DRAFT`, anulación de pago, etc.), con `action` describiendo el tipo de evento y `data` (JSON) con el detalle específico de cada caso. Cubre el permiso `View History Invoices` ya definido.

### Mecanismo de numeración (consecutivos)

Mecanismo dedicado e independiente de cualquier consecutivo genérico existente en el sistema. Dos secuencias separadas:

- **`DRAFT`**: secuencia global que **reutiliza** el menor número liberado (cuando se borra una factura en estado `DRAFT`, su `draft_number` vuelve a estar disponible).
- **`FINAL`**: secuencia global `max + 1`, **sin reuso** — una factura emitida nunca se borra, así que nunca libera su número.

```sql
-- Contador high-water por tipo de consecutivo de factura
CREATE TABLE t_sales_consecutive_sequence (
    type                    VARCHAR(15)     NOT NULL    PRIMARY KEY,    -- 'DRAFT_INV' | 'INV'
    current_value           BIGINT          NOT NULL                    -- último número asignado (high-water)
);

-- Free list: números de DRAFT_INV liberados (al borrar una factura en draft), disponibles para reuso.
-- INV nunca se libera porque las facturas emitidas no se borran.
CREATE TABLE t_sales_consecutive_free (
    type                    VARCHAR(15)     NOT NULL,
    number                  BIGINT          NOT NULL,
    created_at              TIMESTAMP       NOT NULL,
    PRIMARY KEY (type, number)
);

-- Semillas: DRAFT_INV arranca en 1 (0 + 1). INV arranca en el valor que se indique al iniciar el
-- módulo de facturación: current_value = (valor_inicial - 1). Ej. 999 -> primera factura 1000.
-- Este valor se ajusta con un UPDATE simple cuando se defina, sin recompilar.
INSERT INTO t_sales_consecutive_sequence (type, current_value) VALUES ('DRAFT_INV', 0);
INSERT INTO t_sales_consecutive_sequence (type, current_value) VALUES ('INV', 999);
```

Esto resuelve la pregunta abierta que había quedado sobre numeración: es una **secuencia global única** (no por departamento) tanto para `draft_number` como para `number`.

### Formato de presentación (ceros a la izquierda)

**Decisión:** `draft_number` y `number` se guardan en base de datos como `BIGINT` puro (ej. `123`), **nunca** como texto con ceros a la izquierda. El relleno de ceros (5 o 6 dígitos) es responsabilidad de la capa de presentación (DTO de salida de la API o generación del PDF), no de la base de datos ni de la entidad de persistencia.

**Por qué no se guarda formateado en la base de datos:**
- Se necesita poder ordenar y comparar numéricamente (`ORDER BY number`, `max + 1` para el consecutivo). Un valor tipo texto con ceros a la izquierda ordena mal como string (ej. `"000123"` vs `"0001000"` no ordena igual que los números reales).
- Si el ancho de dígitos cambia en el futuro (de 6 a 7, por ejemplo, al superar el volumen), es solo un cambio de formato de presentación — no requiere migrar datos existentes.

**Cómo se aplica en Java**, al construir el DTO o al generar el PDF:

```java
String formattedNumber = String.format("%06d", invoice.getNumber());
// 123 -> "000123"

// Con prefijo, si se necesita distinguir tipo o serie:
String formatted = "INV-" + String.format("%06d", invoice.getNumber());
// -> "INV-000123"
```

`%06d` rellena con ceros hasta completar 6 dígitos (cambiar el `6` por `5` si se prefiere ese ancho); si el número ya tiene más dígitos que el ancho especificado, se muestra completo sin truncar.

### Estado del esquema

El esquema de tablas de facturación quedó **completo** con la última versión enviada — no hay pendientes técnicos de estructura. Decisiones finales registradas:
- `updated_at`: **no se agrega**. `t_invoice_history` ya cubre esa trazabilidad con más detalle (qué cambió, quién, cuándo), así que sería redundante.
- "Draft bloqueado" (no eliminable): **no requiere columna nueva**. Se resuelve a nivel de aplicación comprobando `number IS NOT NULL`; es simple, derivable, y consistente con no duplicar información que ya existe en el esquema.
- Lo único que sigue sin definir a nivel de esquema es **notas de crédito** (sección 9) — pendiente de evaluar con el cliente antes de diseñar su tabla definitiva.

## 9. Notas de crédito (concepto — no evaluado con el cliente, no implementado)

Este módulo **no se ha evaluado con el cliente** y no se ha tocado ninguna funcionalidad al respecto. Lo que sigue es solo la explicación conceptual y una idea de diseño de referencia para cuando llegue el momento de definirlo con negocio — no forma parte del esquema confirmado.

**Qué es:** un documento que **reduce el saldo de una factura ya emitida**, sin modificar la factura original directamente (recordar que `ISSUED` es inmutable). Es el mecanismo correcto para corregir una factura después de que ya tiene pagos registrados — que es justo el caso que la reversión `ISSUED → DRAFT` no puede resolver, porque esa transición está bloqueada si hay pagos.

**Casos de uso típicos:** devolución de producto, error de precio detectado después de emitir, descuento acordado con el cliente después de facturar.

**Cómo funciona conceptualmente:** es casi un "documento espejo" de la factura, pero en negativo:
- Tiene su propio número/consecutivo, normalmente correlativo separado del de facturas.
- Referencia la factura que afecta (`invoice_id`).
- Puede ser **total** (anula el saldo completo restante) o **parcial** (reduce solo por un monto/ítem específico).
- Afecta el cálculo de saldo de la factura original — a efectos de balance, funciona como "un pago negativo", aunque conceptualmente no es un pago.

**Idea de tabla de referencia (no implementada, solo para cuando se defina con el cliente):**

```sql
CREATE TABLE t_invoice_credit_notes (
    id                  UUID            NOT NULL    PRIMARY KEY,
    invoice_id          UUID            NOT NULL    REFERENCES t_invoices,
    number              BIGINT          NOT NULL    UNIQUE,  -- consecutivo propio
    reason              TEXT            NOT NULL,
    amount              NUMERIC(15, 5)  NOT NULL,   -- monto acreditado
    is_full_credit      BOOLEAN         NOT NULL    DEFAULT false,
    path_pdf            VARCHAR(1000),
    created_by_user_id  UUID            NOT NULL    REFERENCES t_users,
    created_at          TIMESTAMP       NOT NULL
);
```

Pendiente de definir junto con negocio: si necesita su propio detalle de líneas (qué producto/monto específico se acredita), su propio mecanismo de consecutivos, y si genera su propio PDF o solo ajusta el saldo internamente.

## 10. Multi-moneda / tasa de cambio (concepto — no es requerimiento actual)

**Contexto:** hoy `t_invoices.currency` define la moneda de la factura, y se asume que los pagos (`t_invoice_payments.amount`) llegan en esa misma moneda. No es un requerimiento confirmado todavía, pero como es una empresa con operación internacional, se deja documentada la idea general por si en el futuro un cliente paga en una moneda distinta a la de la factura.

**El problema que resolvería:** si una factura está en USD pero el cliente transfiere en su moneda local (ej. COP), hoy no hay forma de registrar la tasa de cambio aplicada, ni el monto exacto que se recibió en la moneda original — se estaría forzando a registrar el equivalente en USD sin dejar rastro de cómo se calculó.

**Idea de campos de referencia (para cuando se confirme el requerimiento), extendiendo `t_invoice_payments`:**

```sql
ALTER TABLE t_invoice_payments ADD COLUMN paid_currency VARCHAR(20);        -- moneda en la que efectivamente pagó el cliente
ALTER TABLE t_invoice_payments ADD COLUMN paid_amount_original NUMERIC(15, 5); -- monto en esa moneda original
ALTER TABLE t_invoice_payments ADD COLUMN exchange_rate NUMERIC(15, 6);     -- tasa aplicada al momento del pago
```

Con esto, `amount` seguiría siendo el valor ya convertido a la moneda de la factura (lo que se usa para todos los cálculos de saldo), y los 3 campos nuevos quedarían solo como respaldo/trazabilidad de cómo se llegó a ese monto. No se recomienda intentar resolver conversión automática de tasas (vía API externa u otro mecanismo) mientras no sea un requerimiento confirmado — es fácil sobre-construir algo que el cliente nunca pidió.

## 11. Reporte consolidado por cliente / estado de cuenta

**Implementado** — `GET /sales/invoice/statement/{client_id}`. Es una **consulta agregada** sobre las
tablas existentes (`t_invoices`, `t_invoice_payments`), sin cambios de esquema.

**Qué devuelve:**
- Total facturado histórico al cliente y total efectivamente cobrado.
- Total pendiente de cobro (`facturado - cobrado`).
- **Aging / antigüedad de saldos** — el saldo repartido en `current` (no vencido), `1-30`, `31-60`,
  `61-90` y `90+` días desde `due_at`. Una factura sin `due_at` (términos no calculables) cuenta como
  `current`: sin fecha no hay contra qué estar atrasado.
- Facturas actualmente vencidas (`is_overdue = true`) de ese cliente.

**Qué NO entra en el cálculo:**
- **Los borradores.** Solo cuentan `ISSUED`, `PARTIAL_PAID` y `PAID`: un draft nunca se facturó, así
  que no es ni facturado ni exigible. Incluirlos inflaba el total y el bucket `current`.
- **Las canceladas.** No representan nada adeudado.

**Alcance:** aplica el mismo filtro por vendedor del listado (§12) — sin `VIEW_ALL_INVOICE`, las
cifras solo cubren las facturas propias.

**Pendiente:** el historial de pagos consolidado del cliente (fecha, monto, factura asociada) no se
incluye; hoy los pagos se consultan por factura.

### Otros puntos evaluados y descartados (registro de decisión)

Al revisar el sistema completo se plantearon otros puntos que quedaron descartados o resueltos con lo que ya existe — se dejan aquí para no volver a evaluarlos más adelante sin necesidad:

- **Versionado del PDF (múltiples versiones por factura):** descartado. No lo pidió el cliente, y si se necesita recuperar un PDF antiguo, ya existe el envío por correo electrónico como respaldo — no hace falta guardar versiones dentro del sistema.
- **Envío automático de la factura al cliente por correo:** no aplica. El envío se sigue haciendo de forma manual, usando una funcionalidad de envío que ya existe en el sistema (fuera del módulo de facturación).
- **Datos bancarios / cuenta de pago en la factura:** no requiere campos nuevos en `t_invoices`. Esta información ya se maneja y se muestra directamente en el PDF con los datos que la empresa ya tiene almacenados en otro lugar del sistema; no hace falta duplicarla en la tabla de facturas.

## 12. Permisos / acciones (t_actions)

Lista final acordada:

```sql
INSERT INTO t_actions (id, name, description, menu_item_id, is_active, created_at)
VALUES (5001001, 'Create Invoices', 'Allows you to create a Invoices', 5001, true, now());
INSERT INTO t_actions (id, name, description, menu_item_id, is_active, created_at)
VALUES (5001002, 'Update Invoices', 'Allows you to update a Invoices', 5001, true, now());
INSERT INTO t_actions (id, name, description, menu_item_id, is_active, created_at)
VALUES (5001003, 'View History Invoices', 'Allows you to view history a Invoices', 5001, true, now());
INSERT INTO t_actions (id, name, description, menu_item_id, is_active, created_at)
VALUES (5001004, 'Clone Invoices', 'Clone a Invoices', 5001, true, now());
INSERT INTO t_actions (id, name, description, menu_item_id, is_active, created_at)
VALUES (5001005, 'Cancel Invoices', 'Allows you to cancel an Invoice', 5001, true, now());
INSERT INTO t_actions (id, name, description, menu_item_id, is_active, created_at)
VALUES (5001006, 'Edit Payment Terms Invoices', 'Allows you to edit payment terms and not use those of the Client', 5001, true, now());
INSERT INTO t_actions (id, name, description, menu_item_id, is_active, created_at)
VALUES (5001007, 'View Invoices', 'Allows you to view/list Invoices', 5001, true, now());
INSERT INTO t_actions (id, name, description, menu_item_id, is_active, created_at)
VALUES (5001008, 'Issue Invoices', 'Allows you to issue a Draft Invoice, assigning its final number', 5001, true, now());
INSERT INTO t_actions (id, name, description, menu_item_id, is_active, created_at)
VALUES (5001009, 'Register Payment Invoices', 'Allows you to register a payment on an Invoice', 5001, true, now());
INSERT INTO t_actions (id, name, description, menu_item_id, is_active, created_at)
VALUES (5001010, 'Delete Invoices', 'Allows you to delete a Draft Invoice', 5001, true, now());
INSERT INTO t_actions (id, name, description, menu_item_id, is_active, created_at)
VALUES (5001011, 'Revert Invoice to Draft', 'Allows you to revert an Issued Invoice back to Draft status, keeping its assigned number reserved', 5001, true, now());
INSERT INTO t_actions (id, name, description, menu_item_id, is_active, created_at)
VALUES (5001012, 'Void Payment Invoices', 'Allows you to void a registered payment on an Invoice', 5001, true, now());
INSERT INTO t_actions (id, name, description, menu_item_id, is_active, created_at)
VALUES (5001013, 'View All Invoices', 'Allows you to view and edit all Invoices, regardless of assigned sales rep', 5001, true, now());
```

Nota: `Reject Invoices` se descartó por ser funcionalmente idéntico a `Cancel Invoices`; se mantiene un único permiso (`Cancel Invoices`) para evitar ambigüedad.

### Alcance de facturas por vendedor (`View All Invoices`)

No existía definido quién puede ver/editar qué facturas. Regla acordada:

- **Sin el permiso `View All Invoices`**: el usuario solo puede ver y editar las facturas donde `sales_rep_id` coincide con su propio usuario. Aplica tanto para listar (`View Invoices`) como para las acciones de edición (`Update Invoices`, `Issue Invoices`, etc.) — es un filtro adicional sobre esos permisos existentes, no un permiso que los reemplaza.
- **Con el permiso `View All Invoices`**: el usuario ve y puede operar sobre todas las facturas del departamento, sin el filtro por `sales_rep_id`.

**Implementación recomendada:** aplicar el filtro por `sales_rep_id` a nivel de la consulta/servicio (ej. en el `WHERE` del listado y en la validación de acceso al detalle), condicionado a si el usuario autenticado tiene o no `View All Invoices` — evitar depender de que el frontend oculte filas, ya que eso no protege el acceso vía API directamente.

## 13. Temas pendientes de definir

- Notas de crédito: modelo de datos y flujo detallado (ver sección 9 para la idea conceptual) — pendiente de evaluar con el cliente antes de implementar.
- Impuestos (`t_invoice_taxes`, ver sección 8):
  - **Resuelto:** el frontend envía `type`, `description`, `rate` y `taxable_base`; el **backend calcula y persiste `value` = `taxable_base * rate`** con `BigDecimal` (escala 5, `HALF_UP`), de modo que la aritmética del dinero no viaja por la red. El campo `value` se eliminó del request. La única excepción es el `salesTax` importado desde un PO, que llega como monto suelto sin tasa ni base.
  - **Sigue abierto:** si los impuestos se determinan automáticamente por el país del cliente o se agregan manualmente (hoy: manualmente); si la base gravable debería derivarse en backend del subtotal de productos y/o charges (hoy: la decide el frontend); y cómo se maneja `WITHHOLDING_TAX` en la conciliación de pagos — con la regla actual, una retención dejaría la factura permanentemente en `PARTIAL_PAID`.

---

## 14. Estado de implementación

> Última actualización: 2026-08-10.  
> ✅ Implementado · ⬜ Pendiente · ➖ No aplica a ese componente · 🚫 Fuera de alcance (no confirmado con negocio / no es requerimiento actual)
>
> **Dos columnas de estado, una por componente.** `BE` = backend (este repo); `FE` = frontend
> (Angular). Una fila `✅ / ⬜` significa que el endpoint ya está disponible y lo único que falta es
> consumirlo desde la UI. `➖` en FE marca lógica que vive solo en el servidor y no tiene
> contraparte visual (schedulers, guards, recálculos internos).
>
> El resumen accionable de todo lo que hoy está en `⬜` para frontend está al final de esta
> sección, en "Pendiente de integrar en frontend".

### Encabezado de factura

| Funcionalidad | BE | FE | Referencia en guía | Notas |
|---|---|---|---|---|
| Crear factura (`POST /sales/invoice`) | ✅ | ✅ | §4 — reglas DRAFT | Asigna `draft_number`, open/lock automático, ship-to derivado del cliente |
| Editar factura (`PUT /sales/invoice/{id}`) | ✅ | ✅ | §4 — DRAFT editable | Incluye `CHANGE_SALES_REP` y `EDIT_PAYMENT_TERMS` condicionales |
| Editar campos no financieros en `ISSUED` | ✅ | ⬜ | §4 — campos editables en ISSUED | BE: el PUT en `ISSUED` acepta solo `internalRemarks`, `remarks`, `orderNumber`, `awbBl`, `packingList`; cualquier otro cambio se rechaza nombrando el campo. FE: en `ISSUED` dejar habilitados solo esos cinco inputs |
| Listar facturas con filtros y paginación | ✅ | ✅ | §12 — alcance por vendedor | `VIEW_ALL_INVOICE` / solo propias |
| Ver detalle de factura (`open-lock`) | ✅ | ✅ | §4, §12 | Lock tipo `VIEW` no requiere ownership |
| Clonar factura | ✅ | ✅ | §8 `t_invoice_cloned` | Requiere `CLONE_INVOICE (5001004)` |
| Ver historial de auditoría | ✅ | ✅ | §8 `t_invoice_history` | Requiere `VIEW_HISTORY_INVOICE (5001003)`. Desde la auditoría también aplica el alcance por vendedor: sin `VIEW_ALL_INVOICE` solo se ve el historial de las facturas propias, y una factura inexistente devuelve 404 en vez de lista vacía |
| Emitir factura (`DRAFT → ISSUED`) | ✅ | ⬜ | §4 — reglas ISSUED | BE: `PATCH /{id}/issue`, asigna `number` o conserva el existente, congela `total_amount`, calcula `due_at`. FE: botón "Issue" visible solo en `DRAFT` con `ISSUE_INVOICE`, confirmación, y refresco del detalle (cambia `number`, `issuedAt`, `dueAt`, `status`) |
| Calcular `due_at` según `payment_terms` | ✅ | ⬜ | §6 — 4 grupos de fórmulas | BE: `PaymentTerms` lleva `DueDateRule` + valor; `InvoiceDueDateCalculator`. FE: mostrar `dueAt` en detalle y listado; los términos `ADVANCED`/`PRIOR_TO_SHIPMENT`/`W_DOCUMENTS`/`TO_BE_AGREED` llegan en `null` y deben renderizarse como "por acordar", no vacío |
| Cancelar factura (`DRAFT`/`ISSUED → CANCELLED`) | ✅ | ⬜ | §4 — CANCELLED | BE: `PATCH /{id}/cancel`, sin pagos, libera el lock. FE: modal con `cancelReason` obligatorio (máx. 1000), y tras cancelar cerrar el tab porque el backend ya soltó el lock |
| Revertir a borrador (`ISSUED → DRAFT`) | ✅ | ⬜ | §4 — ISSUED → DRAFT | BE: `PATCH /{id}/revert-to-draft`. FE: confirmación que **advierta que la factura ya no podrá eliminarse** (el `number` queda reservado); tras revertir, `dueAt`/`issuedAt`/`pdfUrl` vuelven a `null` |
| Eliminar factura draft nuevo | ✅ | ⬜ | §4 — Draft nuevo | BE: `DELETE /{id}`, solo si `number IS NULL`. FE: botón de borrar **deshabilitado** cuando `number != null`, aunque el usuario tenga `DELETE_INVOICE` |
| Generación de PDF | ✅ | ⬜ | §4, §8 `path_pdf` | BE: `GET /print/{id}`. En `DRAFT` regenera en cada llamada sin persistir `pdfUrl`; al emitir genera el definitivo y lo guarda. Redondeo a 2 decimales solo aquí. **Falta la plantilla Jasper** en el repo `itex-reports`. FE: botón Print, y badge/aviso de que un PDF en `DRAFT` es preliminar |
| Print & Send | ➖ | ⬜ | §11 | Sin endpoint propio, igual que QR/Q/PO: el FE descarga de `/print/{id}` y reenvía por `POST /email/send-attachment`. Regla del módulo: **el envío solo se habilita con la factura emitida** |
| Marca de factura vencida (`is_overdue`) | ✅ | ⬜ | §4 — manejo OVERDUE | BE: la mantiene el scheduler. FE: badge "Overdue" en listado y detalle, y filtro por vencidas — el campo ya viene en la respuesta pero hoy no se usa |
| Marca de pago fuera de tiempo (`paidLate`) | ✅ | ⬜ | §4 | BE: derivado de `paidAt > dueAt`, expuesto en `InvoiceResponse` y `ListInvoiceResponse`. Conserva el dato cuando `isOverdue` se apaga al pagarse. FE: indicador en listado y detalle |
| Scheduler diario OVERDUE | ✅ | ➖ | §4 — manejo OVERDUE | `InvoiceScheduler`: 23:57 recalcula `is_overdue` en ambos sentidos, 23:58 notifica al sales rep las recién vencidas |
| Recordatorio semanal de vencidas | ✅ | ➖ | §4 | `InvoiceScheduler`: lunes 9:00 AM re-notifica al sales rep todas las que sigan vencidas y sin pagar |
| Unlock nocturno de facturas abiertas | ✅ | ➖ | — | `InvoiceScheduler` 23:56 → `unlockAllOpen()`. Antes una factura abierta y nunca cerrada quedaba bloqueada indefinidamente; QR/Q/PO ya tenían su equivalente |
| Estado de cuenta / reporte aging por cliente | ✅ | ⬜ | §11 | BE: `GET /statement/{client_id}` — facturado, cobrado, saldo, aging (current / 1-30 / 31-60 / 61-90 / 90+) y facturas vencidas, con el mismo alcance por vendedor. Sin migraciones. FE: la vista completa está por construir |
| Multi-moneda / tasa de cambio | 🚫 | 🚫 | §10 — no requerimiento actual | Campos en `t_invoice_payments`; no priorizar |

### Permisos (acciones `t_actions`)

`BE` = el permiso se valida en el endpoint. `FE` = la UI oculta/deshabilita el control cuando el
usuario no lo tiene.

| Acción | ID | BE | FE |
|---|---|---|---|
| `CREATE_INVOICE` | 5001001 | ✅ | ✅ |
| `UPDATE_INVOICE` | 5001002 | ✅ | ✅ |
| `VIEW_HISTORY_INVOICE` | 5001003 | ✅ | ✅ |
| `CLONE_INVOICE` | 5001004 | ✅ | ✅ |
| `CANCEL_INVOICE` | 5001005 | ✅ | ⬜ Falta gatear el botón "Cancel" |
| `EDIT_PAYMENT_TERMS_INVOICE` | 5001006 | ✅ (soft, dentro de PUT) | ✅ |
| `VIEW_INVOICE` | 5001007 | ✅ | ✅ |
| `ISSUE_INVOICE` | 5001008 | ✅ | ⬜ Falta gatear el botón "Issue" |
| `REGISTER_PAYMENT_INVOICE` | 5001009 | ✅ | ⬜ Falta gatear el botón "Registrar pago" |
| `DELETE_INVOICE` | 5001010 | ✅ | ⬜ Falta gatear el botón de borrar (+ regla del draft bloqueado) |
| `REVERT_INVOICE_TO_DRAFT` | 5001011 | ✅ | ⬜ Falta gatear el botón "Revertir a borrador" |
| `VOID_PAYMENT_INVOICE` | 5001012 | ✅ | ⬜ Falta gatear la acción de anular pago |
| `VIEW_ALL_INVOICE` | 5001013 | ✅ (guard de scoping) | ✅ |
| `CHANGE_SALES_REP_INVOICE` | 5001014 | ✅ (soft, dentro de PUT) | ✅ |

### Sub-recursos (line items)

| Funcionalidad | BE | FE | Notas |
|---|---|---|---|
| Productos — CRUD manual | ✅ | ✅ | `POST/PUT/DELETE/GET /sales/invoice/{id}/product[/{pid}]` |
| Productos — importar desde PO vinculado | ✅ | ✅ | `POST .../product/import-from-po`; filtra duplicados por `productId` |
| Productos — listar disponibles en POs vinculadas | ✅ | ✅ | `GET .../product/available-from-pos`; excluye ya importados |
| Charges — CRUD manual | ✅ | ✅ | `POST/PUT/DELETE/GET /sales/invoice/{id}/charge[/{cid}]` |
| Charges — importar desde PO vinculado | ✅ | ✅ | `POST .../charge/import-from-po`; `salesTax` → registro en taxes |
| Charges — listar disponibles en POs vinculadas | ✅ | ✅ | `GET .../charge/available-from-pos`; sin filtro; incluye fila `SALES_TAX` |
| Taxes — CRUD manual | ✅ | ✅ | `POST/PUT/DELETE/GET /sales/invoice/{id}/tax[/{tid}]` |
| Taxes — calcular el `value` del impuesto | ✅ | ⬜ | BE: `value = taxable_base * rate` con `BigDecimal`, escala 5 HALF_UP. FE: **dejar de enviar `value`** en el body — se eliminó del request |
| Taxes — determinar `taxable_base` automáticamente | 🚫 | ✅ | Decisión confirmada: la base gravable la decide el frontend; el backend no la deriva del subtotal de productos |
| POs vinculadas — vincular | ✅ | ✅ | `POST /sales/invoice/{id}/purchase-order` |
| POs vinculadas — desvincular | ✅ | ✅ | `DELETE /sales/invoice/{id}/purchase-order/{po_id}` |
| Recálculo de `total_amount` tras cambios en line items | ✅ | ➖ | `InvoiceAmountCalculator.applyTotals` — invocado en todo add/update/remove; la UI solo refleja el valor devuelto |
| `profit_margin` como porcentaje directo (10.00 = 10%) | ✅ | ⬜ | Rango 0.01–100. FE: ajustar el input y el texto de ayuda — antes se enviaba la fracción (0.10) |

### Pagos

| Funcionalidad | BE | FE | Referencia en guía | Notas |
|---|---|---|---|---|
| Registrar pago (con comprobante) | ✅ | ⬜ | §7 — flujo completo | BE: `POST /{id}/payment` **multipart** (parte `payment` JSON + parte `receipt` archivo), comprobante obligatorio pdf/jpg/jpeg/png, sin sobre-pago. FE: modal "Registrar pago" completo — habilitado solo en `ISSUED`/`PARTIAL_PAID`, muestra total / pagado / saldo, prellena el monto con el saldo, y sube el comprobante |
| Anular pago | ✅ | ⬜ | §7 — anulación | BE: `PATCH /{id}/payment/{pid}/void`. FE: acción por fila con `voidedReason` obligatorio; las filas anuladas deben verse tachadas/marcadas, no ocultarse |
| Listar pagos de una factura | ✅ | ⬜ | §7 | BE: `GET /{id}/payment`, incluye los anulados. FE: tabla de pagos en el detalle de la factura (hoy no existe) |
| Recalcular `paid_amount` y status tras pago/anulación | ✅ | ➖ | §7, §5 | `InvoiceBalanceCalculator.apply` — único punto, usado en registro y anulación |
| Estados `PARTIAL_PAID` / `PAID` en listado y detalle | ✅ | ⬜ | §4 | Los dos estados ya se producen; falta que la UI los muestre con su color/etiqueta y exponga `paidAmount` y `balanceDue` |

### Notas de crédito

| Funcionalidad | BE | FE | Notas |
|---|---|---|---|
| Todo el módulo | 🚫 | 🚫 | §9 — no evaluado con el cliente. Diseñar `t_invoice_credit_notes` y flujo cuando se confirme |

### Reglas de negocio transversales

| Regla | BE | FE | Notas |
|---|---|---|---|
| `DRAFT` editable; `ISSUED`/`PAID`/`CANCELLED` inmutables | ✅ | ✅ | `InvoiceMutationGuard.assertEditable` |
| Lock por usuario para editar | ✅ | ✅ | `InvoiceMutationGuard.assertLockedByCurrentUser` |
| Scoping por `salesRep` / `VIEW_ALL_INVOICE` | ✅ | ✅ | `InvoiceAccessGuard.assertCanAccess` |
| `VIEW_ALL_INVOICE` no otorga write access | ✅ | ✅ | `InvoiceAccessGuard.assertCanMutate` |
| Máx. tabs abiertos por usuario (`itex.tabs.max-tabs-open`) | ✅ | ✅ | Validado en create y en open-lock EDIT |
| Desbloquear al cerrar sesión | ✅ | ✅ | `InvoiceLockService.closeAllOpenByUser` |
| Draft nuevo (`number IS NULL`) eliminable; draft bloqueado no | ✅ | ⬜ | BE: `InvoiceDeleteServiceImpl.assertDeletable`. FE: deshabilitar el botón de borrar cuando `number != null` |
| ISSUED: contenido financiero inmutable | ✅ | ⬜ | BE: line items solo en `DRAFT` + `total_amount` congelado al emitir + el PUT rechaza todo campo financiero del encabezado. FE: al pasar a `ISSUED` debe bloquear los editores de productos/charges/taxes y dejar editables solo los cinco campos no financieros |
| Cerrar una factura solo si el lock es propio | ✅ | ✅ | `PATCH /close/{id}` valida el dueño del lock: antes cualquier usuario del módulo podía soltar el lock de otro. Cerrar una factura no abierta, o abierta por uno mismo, sigue siendo idempotente |
| Índices de acceso en la base de datos | ✅ | ➖ | Agregados en `V2.0.2` (§8): listado, locks, scheduler de vencidas y las tres tablas hijas por `invoice_id`. PostgreSQL no indexa las FK por sí solo |
| Reversión bloqueada si hay pagos | ✅ | ⬜ | BE: `InvoiceTransitionGuard.assertNoPayments`. FE: ocultar/deshabilitar "Revertir" y "Cancelar" cuando la factura tiene pagos vigentes, en vez de dejar que el usuario reciba el 400 |
| `is_overdue` forzado a `false` al llegar a `PAID` | ✅ | ➖ | `InvoiceBalanceCalculator.apply` (también limpia `overdue_notified_at`) |
| `due_at` limpiado al revertir a DRAFT | ✅ | ➖ | `InvoiceStatusServiceImpl.revertToDraft` |
| Todas las transiciones centralizadas en un solo punto | ✅ | ➖ | `InvoiceTransitionGuard` — matriz única; ningún endpoint escribe `status` por su cuenta |
| Factura en `PAID` bloqueable para anular pagos | ✅ | ⬜ | BE: `LOCKABLE_STATUSES` incluye `PAID`; solo `CANCELLED` queda fuera. FE: permitir abrir en modo edición una factura `PAID` (hoy la UI asume que es final) |

### Pendiente de integrar en frontend

Todo lo de abajo **ya tiene endpoint disponible y documentado** en
[itex-invoices-api.md](itex-invoices-api.md) §15–§17; es trabajo exclusivo de UI.

1. **Acciones de estado en el detalle** — botones "Issue", "Revertir a borrador" y "Cancelar",
   cada uno gateado por su permiso y por el estado actual (§15). El de revertir debe advertir que
   la factura quedará sin poder eliminarse; el de cancelar pide motivo obligatorio y cierra el tab.
2. **Borrado de factura** — `DELETE /sales/invoice/{id}` con el botón deshabilitado en drafts
   bloqueados (`number != null`).
3. **Módulo de pagos** — tabla de pagos en el detalle, modal "Registrar pago" (multipart con
   comprobante obligatorio, monto prellenado con el saldo y tope en el saldo) y acción de anular
   con motivo (§16).
4. **Estados y montos derivados** — `PARTIAL_PAID`/`PAID` con su etiqueta, y `paidAmount` /
   `balanceDue` visibles en listado y detalle.
5. **Vencimiento** — mostrar `dueAt` (con el caso `null` para términos no calculables), el badge de
   `isOverdue` y el de `paidLate` (pagada fuera de tiempo), más el filtro de vencidas en el listado.
6. **`profit_margin` como porcentaje** — el input pasa a recibir 10.00 en vez de 0.10, rango
   0.01–100.
7. **Bloqueo de edición financiera en `ISSUED`** — dejar habilitados únicamente `internalRemarks`,
   `remarks`, `orderNumber`, `awbBl` y `packingList`; el resto del encabezado y los line items van
   deshabilitados. Y **apertura en modo edición de facturas `PAID`** (necesario para anular un pago).
8. **Print y Print & Send** — botón de imprimir contra `GET /print/{id}` (advirtiendo que en
   `DRAFT` el PDF es preliminar y se regenera en cada llamada), y el "Print & Send" del patrón
   QR/Q/PO: descargar el PDF y reenviarlo por `POST /email/send-attachment`, **habilitado solo con
   la factura emitida**.
9. **Impuestos** — quitar `value` del body de `POST`/`PUT .../tax`; ahora lo calcula el backend.
10. **Estado de cuenta del cliente** — vista nueva sobre `GET /statement/{client_id}`: totales,
    aging por rangos y facturas vencidas.

# CHANGELOG FRONTEND — Módulo Quotations (Q) / Quote Requests (QR)

Fecha: 2026-09-03

Este documento describe los cambios de lógica de negocio, modificaciones en el contrato del API y nuevas reglas de validación introducidas en el backend que impactan al Frontend.

---

## 1. Resumen de cambios

| # | Cambio | Impacto |
|---|--------|---------|
| 1 | Nuevo cálculo de `freightCharges` en la cotización | Cambia el valor devuelto (solo QR con productos en la Q) |
| 2 | Bloqueo de add/remove de QR cuando la Q NO está en `CREATED` | Nuevos errores 400 |
| 3 | Transición automática de estados de QR al cambiar la Q a `ANSWERED` | Debe refrescar el estado de las QR asociadas |
| 4 | Inmutabilidad de QR en estados `REJECTED` / `COMPLETE` | Nuevos errores 400 en endpoints de modificación de QR |
| 5 | `COMPLETE` de Q requiere ≥1 PO asociada; rechazo solo sin PO | Nuevos errores 400 |
| 6 | Nuevos campos de ganancia en productos de la cotización | Nuevos campos en el response |
| 7 | `COMPLETE` de QR manual solo desde `ANSWERED` y con el permiso "Complete QR" (id 4002004); el automático se mantiene | Nuevo permiso/acción; mostrar "Complete" solo con el permiso |
| 8 | Rechazo automático de QR vencidas (30 días) + registro en el historial | Nuevos `action` de historial; refrescar listados |
| 9 | Historial de cambios de estado de QR por Q | Nuevo `action` de historial |

---

## 2. Detalle de cambios

### 2.1 Cálculo de Freight Charges (lógica de respuesta)

**Endpoint afectado:** cualquier respuesta que incluya el objeto de cotización (`GET /ip/q`, `PUT /ip/q/{id}`, `POST /ip/q/{id}/quote-requests`, `PATCH /ip/q/{id}/change-status`, etc.)

**Cambio de lógica:** El campo `freightCharges` (y por ende `total`) de la cotización ahora suma **únicamente** los freight charges de aquellas QR asociadas que aportan **al menos 1 producto** a la cotización.

- Si una QR está vinculada a la Q pero ninguno de sus productos fue incluido en la cotización, su freight charge **NO** se cobra.
- Los *Other Charges* importados de una QR **no influyen** en este cálculo (siguen sumándose en `totalOtherCharges` sin cambios).

**Acción Frontend:** Ninguna. El campo `freightCharges` mantiene el mismo nombre y tipo (`BigDecimal`); solo cambia su valor. Verificar que no se esté recalculando el freight en el cliente con la suma de `listQuoteRequests[].freightCharges` (eso ahora daría un valor distinto al del servidor).

### 2.2 Nuevos campos en productos de la cotización

**Endpoints afectados:** respuestas que incluyan `products[]` de la cotización.

**Nuevos campos en `IpQuotationProductResponse`:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `unitProfit` | `BigDecimal` (escala 5) | Ganancia sobre el precio unitario: `sellingUnitPrice − precio de compra unitario de la QR` |
| `totalProfit` | `BigDecimal` (escala 2) | Ganancia sobre el precio total: `sellingExtendedPrice − extendedPrice de la QR` |

```json
{
  "products": [
    {
      "id": "...",
      "quotationsQuoteRequestId": "...",
      "number": 1,
      "profitMargin": 10.00,
      "condition": "NEW",
      "sellingUnitPrice": 110.00000,
      "sellingExtendedPrice": 1100.00000,
      "unitProfit": 10.00000,
      "totalProfit": 100.00,
      "grossWeightLbs": 25.0,
      "qrNumber": "QR-0001",
      "supplierName": "ACME Inc."
    }
  ]
}
```

**Acción Frontend:** Puede renderizar estos campos directamente (ej. columnas "Unit Profit" y "Total Profit" en la grilla de productos). No es necesario calcularlos en el cliente.

### 2.3 Bloqueo de add/remove de QR fuera de status CREATED

**Endpoints afectados:**

| Método | Ruta | Nueva regla |
|--------|------|-------------|
| `POST` | `/ip/q/{id_quotation}/quote-requests` | Solo permitido con Q en `CREATED` |
| `DELETE` | `/ip/q/{id_quotation}/quote-requests/{id_qqr}` | Solo permitido con Q en `CREATED` |

**Errores nuevos (HTTP 400):**

| Key | Mensaje |
|-----|---------|
| `ip.q.qr.cannot-add` | "Quote Requests cannot be added. Quote Requests can only be added while the Quotation is in CREATED status" |
| `ip.q.qr.cannot-delete` | "Quote Request cannot be deleted. Quote Requests can only be removed while the Quotation is in CREATED status" |

**Acción Frontend:** Ocultar/deshabilitar los botones "Agregar QR" y "Eliminar QR" cuando la Q **no** esté en estado `CREATED` (aplica también a `SENT`, `ANSWERED`, `COMPLETE`, `REJECTED`). Si el usuario necesita modificar las QR de una Q en `SENT`, primero debe revertirla a `CREATED`. Mantener el manejo del error 400 por si la UI queda desincronizada.

### 2.4 Transición automática de QR al cambiar la Q a ANSWERED

**Endpoint afectado:** `PATCH /ip/q/{id_quotation}/change-status?status=ANSWERED`

**Nueva lógica de negocio:** Al pasar la Q a `ANSWERED`, el backend automatically actualiza el estado de **cada QR asociada**:

| Condición | Estado resultante de la QR | Timestamp |
|-----------|---------------------------|-----------|
| La QR aporta ≥1 producto a la Q | `COMPLETE` | `completeAt = ahora` |
| La QR no aporta ningún producto a la Q | `REJECTED` | `rejectAt = ahora` |

- Esta transición automática **sí puede rechazar una QR** aunque esté vinculada a la Q (excepción deliberada respecto al rechazo manual, que sigue bloqueado en ese caso).
- La presencia de *Other Charges* importados de una QR **no** evita el rechazo automático.
- Si una QR ya estaba en estado terminal (`COMPLETE`/`REJECTED`), se deja intacta.

**Acción Frontend:** Al recibir respuesta exitosa del `change-status` a `ANSWERED`, **recargar las QR asociadas** (listado y detalle), ya que sus estados pueden haber cambiado. Mostrar el nuevo estado en los enlaces de QR de la pantalla de cotización.

### 2.5 Inmutabilidad de QR en estados REJECTED / COMPLETE

**Endpoints bloqueados (HTTP 400 con `ip.qr.not-editable-by-status`):**

| Método | Ruta |
|--------|------|
| `PUT` | `/ip/qr/{qr_id}` (update) |
| `PATCH` | `/ip/qr/{id_quote_request}/change-status` (ya existía vía validación de estado terminal; además `status=COMPLETE` manual requiere permiso y status `ANSWERED`, ver sección 2.7) |
| `DELETE` | `/ip/qr/{id_quote_request}` (rechazo manual, ya existía vía validación de estado terminal) |
| `POST` | `/ip/qr/{id_quote_request}/product` |
| `PUT` | `/ip/qr/{id_quote_request}/product/{id_qr_product}` |
| `DELETE` | `/ip/qr/{id_quote_request}/product/{id_qr_product}` |
| `POST` | `/ip/qr/{id_quote_request}/other_charges` |
| `PUT` | `/ip/qr/{id_quote_request}/other_charges/{id_qr_other_charge}` |
| `DELETE` | `/ip/qr/{id_quote_request}/other_charges/{id_qr_other_charge}` |

**Mensaje de error (HTTP 400):**

| Key | Mensaje |
|-----|---------|
| `ip.qr.not-editable-by-status` | "The Quote Request cannot be modified because it is in REJECTED or COMPLETED status" |

**EXCEPCIONES — siguen permitidas sin importar el estado:**

| Método | Ruta | Comportamiento |
|--------|------|----------------|
| `PATCH` | `/ip/qr/clone/{qr_id}` | Clonado siempre permitido |
| `GET` | `/ip/qr/print/{id_quote_request}` | Si la QR está en estado terminal y ya existe PDF, se devuelve el PDF guardado (no se regenera). El último PDF se genera al cambiar a `COMPLETE`/`REJECTED`. |
| `GET` | `/ip/qr` y demás endpoints de consulta | Lectura siempre permitida |

**Cierre del open-lock al pasar a estado terminal:** al cambiar una QR a `COMPLETE` o `REJECTED` (manual o automático), el backend limpia `openBy` y `openAt`. La QR queda cerrada: deja de aparecer en `GET /ip/qr/load-open` y nunca más vuelve a bloquearse.

**Acción Frontend:** Ocultar/deshabilitar en la pantalla de QR los botones de edición (update, cambio de estado, rechazo, y CRUD de productos y other charges) cuando `status ∈ {REJECTED, COMPLETE}`. Conservar visibles "Clonar" e "Imprimir".

### 2.6 Restricciones de estado de la Q según PO asociadas

**Endpoints afectados:**

| Método | Ruta | Nueva regla |
|--------|------|-------------|
| `PATCH` | `/ip/q/{id_quotation}/change-status?status=COMPLETE` | Requiere **≥1 PO** asociada a la Q |
| `DELETE` | `/ip/q/{id_quotation}` (rechazo) | Solo permitida si la Q **NO tiene PO** asociadas |
| `PATCH` | `/ip/q/{id_quotation}/change-status?status=SENT` o `CREATED` (rollback desde `ANSWERED`) | Bloqueado si la Q tiene PO asociadas |

**Mensajes de error (HTTP 400):**

| Key | Mensaje |
|-----|---------|
| `ip.q.complete-requires-po` | "The Quotation cannot be completed because it does not have any associated Purchase Order" |
| `ip.q.cannot-reject-with-po` | "The Quotation cannot be rejected because it has associated Purchase Orders" |
| `ip.q.cannot-revert-with-po` | "The Quotation status cannot be reverted because it has associated Purchase Orders" |

**Acción Frontend:**

- Deshabilitar el botón "Complete" en la Q cuando `listPurchaseOrders` esté vacío.
- Deshabilitar el botón "Reject" en la Q cuando `listPurchaseOrders` no esté vacío.
- Deshabilitar el retroceso de estado (`ANSWERED → SENT/CREATED`) cuando `listPurchaseOrders` no esté vacío.
- El array `listPurchaseOrders` (ya existente en el response de la Q) es la fuente de verdad para estas decisiones en UI, pero igualmente debe manejarse el error 400 (puede haber PO recién creadas por otro usuario).

### 2.7 COMPLETE de QR: manual solo desde ANSWERED y con permiso

**Endpoint afectado:** `PATCH /ip/qr/{id_quote_request}/change-status?status=COMPLETE`

**Nueva regla:** El status `COMPLETE` lo asigna el sistema **automáticamente** cuando la Q que contiene la QR pasa a `ANSWERED` (ver sección 2.4). Además, ahora existe un **segundo camino manual (fallback)**: solo puede completar manualmente una QR quien tenga la acción **`COMPLETE_IP_QUOTE_REQUESTS` (id `4002004`)** y **solo cuando la QR esté en status `ANSWERED`**.

| Caso | Resultado |
|------|-----------|
| `status=COMPLETE` sin el permiso id `4002004` (ni SUPER_ADMIN) | HTTP 400 — `ip.qr.no-manual-complete` |
| `status=COMPLETE` con el permiso desde `CREATED` o `SENT` | HTTP 400 — `ip.qr.manual-complete-requires-answered` |
| `status=COMPLETE` con el permiso desde `ANSWERED` | **Permitido** (setea `completeAt`, registra historial UPDATE con diff de status) |

**Mensajes de error (HTTP 400):**

| Key | Mensaje |
|-----|---------|
| `ip.qr.no-manual-complete` | "The QR is completed automatically when a Quotation containing its products is answered. To complete it manually you need the Complete QR permission" |
| `ip.qr.manual-complete-requires-answered` | "The Quote Request must be in ANSWERED status to be completed manually" |

**Cambios adicionales relacionados:**
- El valor automático (vía Q → `ANSWERED`) **no cambia**: sigue sin requerir usuario ni permiso.
- Nuevo `ModuleAction`: `COMPLETE_IP_QUOTE_REQUESTS` (id `4002004`) del módulo QR (menu id `4002`), **no** incluido por defecto en ningún rol (excepto SUPER_ADMIN). El rol que deba usar el fallback debe recibir la acción desde la administración de roles.
- La validación previa `ip.qr.not-valid-complete` ("The QR is not valid to be completed") fue **eliminada** por obsoleta.

**Acción Frontend:**
- Obtener las acciones del rol vía `GET /admin/roles/action/list-id/{roleId}` y, en la pantalla de QR, mostrar/ocultar la opción "Complete" del menú de cambio de estado según el id `4002004`.
- Mostrar la opción **solo** cuando `status === 'ANSWERED'` (aunque se tenga el permiso) — las transiciones desde `CREATED`/`SENT` devuelven 400.
- Estados seleccionables manualmente sin permiso: `SENT`, `ANSWERED` (y el rechazo vía `DELETE /ip/qr/{id}`).
- Manejar el error 400 con las keys `ip.qr.no-manual-complete` y `ip.qr.manual-complete-requires-answered` por seguridad (estado/permisos pueden cambiar por otro usuario).

### 2.8 Rechazo automático de QR vencidas (scheduler) + historial

**Sin endpoint afectado:** proceso automático ejecutado por un job diario a las **00:00 (cron `0 0 0 * * *`)**. Reemplaza los 3 jobs anteriores (45 días, 23:50:30) por uno solo.

**Reglas (comparación por FECHA, se ignora la hora; zona `America/New_York`):**

| Regla | Condición de rechazo | En referencia a |
|-------|----------------------|-----------------|
| CREATED | `fecha(createdAt) ≤ hoy − 30 días` | `createdAt` |
| SENT | `fecha(sentAt) ≤ hoy − 30 días` | `sentAt` |
| ANSWERED | `fecha(answeredAt) ≤ hoy − 30 días` **y NO asociada a ninguna Quotation** | `answeredAt` |

- Si la QR está asociada a una Quotation (aunque sea en status ANSWERED), **no** se auto-rechaza.
- Cada rechazo deja `rejectAt = ahora` y registra un historial con `action = AUTO_REJECTED_TIME`.
- El `user` del historial es el **sales rep** de la QR.

**Acción Frontend:** Al cargar listados/detalle de QR, el backend ya debe mostrar el nuevo estado `REJECTED` (si el usuario mantiene la pantalla abierta durante la ejecución del job, deberá refrescar). Debe renderizar el nuevo `action` del historial `AUTO_REJECTED_TIME` (ver sección 2.10).

### 2.9 Historial de cambio de estado de QR por Quotation

**Endpoint afectado:** `PATCH /ip/q/{id_quotation}/change-status?status=ANSWERED`

Al responder una Q, cuando una QR asociada se transiciona automáticamente a `COMPLETE`/`REJECTED`, se registra un historial en cada QR con `action = STATUS_CHANGE_BY_Q`. El `user` es el **usuario autenticado** que respondió la Q.

**Acción Frontend:** Debe renderizar el nuevo `action` del historial `STATUS_CHANGE_BY_Q`.

### 2.10 Nuevos `action` del historial de QR

El historial de QR (`GET /ip/qr/history/{qr_id}`) expone ahora dos `action` nuevos. Forma del campo `data`:

**`AUTO_REJECTED_TIME`** (rechazo automático por tiempo):
```json
{
  "status": { "old": "SENT", "new": "REJECTED" },
  "message": "The Quote Request was automatically rejected for exceeding 30 days without activity (status SENT)"
}
```
> El `{0}` del mensaje es el **status en el que venció** la QR (CREATED/SENT/ANSWERED), no el estado destino.

**`STATUS_CHANGE_BY_Q`** (cambio de estado inducido por una Quotation):
```json
{
  "status": { "old": "ANSWERED", "new": "COMPLETE" },
  "quotationNumber": "Q-0001",
  "message": "The Quote Request status was changed automatically to COMPLETE because the Quotation Q-0001 was answered"
}
```

**Acción Frontend:** mapear estos dos `action` nuevos en la traducción/UI del historial de QR y mostrar el campo `message`/`status`.

---

## 3. Nuevos mensajes de error (i18n keys)

Agregar al diccionario del Frontend si se mapean keys a textos locales:

```
ip.q.qr.cannot-add            → Quote Requests cannot be added. Quote Requests can only be added while the Quotation is in CREATED status
ip.q.qr.cannot-delete         → Quote Request cannot be deleted. Quote Requests can only be removed while the Quotation is in CREATED status (texto actualizado)
ip.q.complete-requires-po     → The Quotation cannot be completed because it does not have any associated Purchase Order
ip.q.cannot-reject-with-po    → The Quotation cannot be rejected because it has associated Purchase Orders
ip.q.cannot-revert-with-po    → The Quotation status cannot be reverted because it has associated Purchase Orders
ip.qr.not-editable-by-status  → The Quote Request cannot be modified because it is in REJECTED or COMPLETED status
ip.qr.no-manual-complete      → The QR is completed automatically when a Quotation containing its products is answered. To complete it manually you need the Complete QR permission (texto actualizado)
ip.qr.manual-complete-requires-answered → The Quote Request must be in ANSWERED status to be completed manually
ip.qr.history.auto-rejected-time → The Quote Request was automatically rejected for exceeding 30 days without activity (status {0})
ip.qr.history.status-change-by-q → The Quote Request status was changed automatically to {0} because the Quotation {1} was answered
```

**Keys eliminadas (obsoletas):**

```
ip.qr.not-valid-complete      → Reemplazada por ip.qr.no-manual-complete
```

---

## 4. Resumen de contract changes (DTOs / Responses)

| Objeto | Cambio |
|--------|--------|
| `IpQuotationResponse` / `ListIpQuotationResponse` → `freightCharges`, `total` | **Semántica**: ahora solo suman freight de QR con productos en la Q (mismo nombre/tipo) |
| `IpQuotationProductResponse` | **Nuevos campos**: `unitProfit: BigDecimal`, `totalProfit: BigDecimal` |
| `IpQuoteRequestHistoryResponse.action` | **Nuevos valores**: `AUTO_REJECTED_TIME`, `STATUS_CHANGE_BY_Q` (+ `data` con `status`/`message`/`quotationNumber`) |
| Permisos / roles | **Nueva acción** `COMPLETE_IP_QUOTE_REQUESTS` (id `4002004`, módulo QR, menu id `4002`) — aparece en la respuesta de acciones del rol; no viene asignada por defecto a ningún rol |
| `PATCH /ip/qr/{id}/change-status?status=COMPLETE` | Ahora permitido **solo** desde `ANSWERED` y con el permiso `4002004`; antes siempre 400 |
| `IpQuoteRequestResponse` / `IpQuoteRequestDTO` → `openBy`, `openAt` | Al pasar a `COMPLETE`/`REJECTED` pasan a `null` (open-lock se cierra; la QR no vuelve a bloquearse) |
| Payloads de request | Sin cambios |
| Endpoints / rutas | Sin cambios |
| Scheduler QR | Los 3 jobs de rechazo (45 días, 23:50:30) fueron reemplazados por 1 job diario a las 00:00 (30 días) |

No hay cambios *breaking* en nombres ni tipos de campos; únicamente se agregan campos nuevos y nuevas validaciones que devuelven HTTP 400 con los mensajes indicados.

---

## 5. Resumen consolidado de lógica de negocio

Checklist agrupado de todas las reglas aplicadas al módulo Q/QR para verificar/implementar en el Frontend.

### 5.1 Ciclo de vida de la QR (Quote Request)

| # | Regla de negocio | Condición / Resultado |
|---|------------------|-----------------------|
| 1 | `CREATED → SENT` — **siempre manual** (vía `PATCH .../change-status`; el flujo del front suele ser imprimir y luego enviar) | Requiere proveedor asignado, si no → 400 `ip.qr.supplier.required.for.status.change`; setea `sentAt` |
| 2 | `SENT → ANSWERED` — **siempre manual** | **Todos** los productos deben tener precio **y** lead time (`unitPrice`, `leadTime`, `leadTimeType`), además de `sentAt` presente → 400 `ip.qr.not-valid-answered`; todos los productos deben estar activos → 400 `ip.qr.products-not-active`; setea `answeredAt` |
| 3 | Rollback `ANSWERED → SENT/CREATED` | Bloqueado si la QR está asociada a alguna Q (no es un flujo manual para "des-responder") → 400 `ip.qr.assigned-to-q` |
| 4 | Rechazo manual (`DELETE /ip/qr/{id}`) | Solo desde estados no terminales y si todas sus Q asociadas están `REJECTED`; si tiene alguna Q no rechazada → 400 `ip.qr.assigned-to-q-rejected` |
| 5 | **COMPLETE manual** (`PATCH .../change-status?status=COMPLETE`) | Solo desde estado `ANSWERED` **y** con permiso id `4002004` (o SUPER_ADMIN). Automático no cambia |
| 6 | Cambiar al mismo status | 400 `ip.qr.equal-status` |
| 7 | Cambio de status desde estado terminal (`REJECTED`/`COMPLETE`) | Bloqueado |
| 8 | Inmutabilidad de QR en `REJECTED`/`COMPLETE` | Update, status, rechazo y CRUD de productos / other charges bloqueados (`ip.qr.not-editable-by-status`); clonar e imprimir siguen permitidos. Al pasar a estado terminal el backend limpia `openBy`/`openAt` (la QR queda cerrada, deja `GET /ip/qr/load-open` y nunca más se bloquea) |

**Componentes opcionales de la UI:**
- Menú de "Complete" visible **solo** si el rol tiene la acción `4002004` (`GET /admin/roles/action/list-id/{roleId}`) y el status de la QR es `ANSWERED`.
- Menú de "Reject" **solo** si la QR no tiene Q asociadas (o todas sus Q asociadas están `REJECTED`).
- Edición de productos / other charges / datos **solo** si `status ∉ {REJECTED, COMPLETE}`.

### 5.2 Ciclo de vida de la Q (Quotation) y su relación con la QR

| # | Regla de negocio | Condición / Resultado |
|---|------------------|-----------------------|
| 1 | Add/remove de QR en la Q | Solo con Q en `CREATED` → 400 `ip.q.cannot-add` / `ip.q.cannot-delete` |
| 2 | **Q → `ANSWERED`** | Dispara transición automática de las QR asociadas (ver 5.3) y las deja inmutables |
| 3 | **Q → `COMPLETE`** | Requiere ≥1 PO asociada → 400 `ip.q.complete-requires-po` |
| 4 | **Rechazo de Q** (`DELETE /ip/q/{id}`) | Solo si la Q **no** tiene PO → 400 `ip.q.cannot-reject-with-po` |
| 5 | **Rollback de Q** (`ANSWERED → SENT/CREATED`) | Bloqueado si la Q tiene PO → 400 `ip.q.cannot-revert-with-po` |
| 6 | Modificación de datos de una Q (p. ej. application date, términos) | La fecha de aplicación es **solo fecha** (sin hora) y se valida antes de pasar a `SENT`/`ANSWERED` |

### 5.3 Transiciones automáticas (el sistema, no el usuario)

| # | Disparador | Resultado en la QR | Detalle |
|---|-----------|--------------------|---------|
| 1 | Q pasa a `ANSWERED` | QR con ≥1 producto en la Q → **`COMPLETE`** | `completeAt = ahora`; historial `STATUS_CHANGE_BY_Q` (user = quien respondió la Q) |
| 2 | Q pasa a `ANSWERED` | QR sin productos en la Q → **`REJECTED`** | `rejectAt = ahora`; historial `STATUS_CHANGE_BY_Q` |
| 3 | Q pasa a `ANSWERED` | QR ya en estado terminal | Queda intacta (no se toca) |
| 4 | Job diario **00:00 ET** (`0 0 0 * * *`) | QR `CREATED` con `createdAt` ≤ hoy−30 → **`REJECTED`** | Historial `AUTO_REJECTED_TIME` (user = sales rep de la QR) |
| 5 | Job diario **00:00 ET** | QR `SENT` con `sentAt` ≤ hoy−30 → **`REJECTED`** | Historial `AUTO_REJECTED_TIME` |
| 6 | Job diario **00:00 ET** | QR `ANSWERED` con `answeredAt` ≤ hoy−30 **y sin Q asociada** → **`REJECTED`** | Si está asociada a una Q, no se auto-rechaza |

> La comparación del job es por **fecha** (se ignora la hora), zona `America/New_York`.

**Frontend:** refrescar listados/detalle cuando la Q pasa a `ANSWERED` (los estados de las QR pueden cambiar) y tras la ejecución del job diario; pintar los `action` `AUTO_REJECTED_TIME` y `STATUS_CHANGE_BY_Q` en el historial.

### 5.4 Cálculos

| # | Campo | Regla |
|---|-------|-------|
| 1 | `freightCharges` / `total` de la Q | Suma **solo** freight de QR que aportan ≥1 producto a la Q (verificar no recalcular en el cliente) |
| 2 | `unitProfit` | `sellingUnitPrice − precio de compra unitario` (devuelto por el backend, escala 5) |
| 3 | `totalProfit` | `sellingExtendedPrice − extendedPrice` (devuelto por el backend, escala 2) |
| 4 | `profitMargin` (input) | Ahora **porcentaje directo** (0.01 a 100; ej. `10.00 = 10%`), ya no fracción (`0.10`) |
| 5 | `netWeightLbs` (input) | Precisión de **5 decimales** (permite gramos; ej. `1 g = 0.00220 lb`) |

### 5.5 Permisos (ModuleActions del módulo QR, menu id `4002`)

| id | Acción | Uso |
|----|--------|-----|
| `4002001` | Create QR | Crear QR |
| `4002002` | Update QR | Editar QR |
| `4002003` | View History QR | Ver historial (`GET /ip/qr/history/{id}`) |
| `4002004` | **Complete QR** (nuevo, reutiliza un id libre) | COMPLETE manual desde `ANSWERED` (fallback). **No** viene asignado por defecto; el admin lo otorga por rol |
| `4002005` | Clone QR | Clonar |
| `4002006` | Reject QR | Rechazo manual |
| `4002008` | Edit Payment Terms from QR | Editar términos de pago sin usar los del proveedor |

> SUPER_ADMIN posee todas las acciones. El id `4002007` queda reservado para futuras acciones.

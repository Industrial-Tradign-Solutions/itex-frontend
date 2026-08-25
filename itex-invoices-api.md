# API REST — Módulo de Facturación (ITEX)

> Documentación para consumo desde Angular.  
> Base URL: `/itex/api/sales/invoice`  
> Content-Type general: `application/json`  
> Autenticación: JWT en header `Authorization: Bearer <token>`

---

## 1. Listar facturas

```
GET /sales/invoice?page=0&size=10&status=ISSUED
```

### Entrada (query params)

| Parámetro | Tipo | Default | Obligatorio | Descripción |
|---|---|---|---|---|
| `page` | `int` | `0` | No | Número de página (0-based) |
| `size` | `int` | `10` | No | Tamaño de página |
| `shortBy` | `string` | `createdAt` | No | Campo de ordenamiento: `createdAt`, `draftNumber`, `number`, `status`, `totalAmount`, `paidAmount`, `dueAt` |
| `shortOrder` | `int` | `0` | No | `0` = DESC, `1` = ASC |
| `number` | `number` | — | No | Número oficial exacto |
| `draftNumber` | `number` | — | No | Número de borrador exacto |
| `clientId` | `UUID` | — | No | ID del cliente |
| `remarks` | `string` | — | No | Búsqueda parcial (LIKE) en observaciones |
| `status` | `string` | — | No | `DRAFT`, `ISSUED`, `PARTIAL_PAID`, `PAID`, `CANCELLED` |
| `salesRepId` | `UUID` | — | No | ID del vendedor |
| `department` | `string` | — | No | Departamento (ej. `IP`) |
| `overdue` | `boolean` | — | No | `true`/`false` — filtrar vencidas |
| `initDueAt` | `ISO datetime` | — | No | Vencimiento desde |
| `endDueAt` | `ISO datetime` | — | No | Vencimiento hasta |
| `date` | `string` | — | No | Filtro rápido: `ALL`, `TODAY`, `YESTERDAY`, `THIS_WEEK`, `LAST_WEEK`, `THIS_MONTH`, `LAST_MONTH`, `THIS_YEAR`, `LAST_YEAR`, `CUSTOM` |
| `initDate` | `ISO datetime` | — | No | Fecha creación desde (si `date=CUSTOM`) |
| `endDate` | `ISO datetime` | — | No | Fecha creación hasta (si `date=CUSTOM`) |

### Response 200 OK

```json
{
  "content": [
    {
      "id": "uuid",
      "draftNumber": "000001",
      "number": "001000",
      "name": "INV-001000",
      "client": {
        "id": "uuid",
        "code": "CLT-001",
        "name": "Cliente S.A.",
        "showName": "(CLT-001) Cliente S.A.",
        "taxId": "123456789",
        "address": "Calle Principal 123",
        "city": { "id": "uuid", "name": "Miami" },
        "zipCode": "33101",
        "phoneNumber": "+1234567890",
        "paymentTerms": "NET_30"
      },
      "salesRep": {
        "id": "uuid",
        "fullName": "Juan Pérez",
        "user": "jperez"
      },
      "status": "ISSUED",
      "currency": "USD",
      "totalAmount": 15000.00,
      "paidAmount": 5000.00,
      "balanceDue": 10000.00,
      "dueAt": "2026-08-30T23:59:59-04:00",
      "overdue": false,
      "createdAt": "2026-07-15T10:30:00-04:00"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10,
    "sort": { "sorted": true, "direction": "DESC" }
  },
  "totalElements": 1,
  "totalPages": 1,
  "last": true,
  "first": true,
  "empty": false
}
```

### Errores posibles

| Código | Condición | Cuerpo |
|---|---|---|
| `401` | Token JWT ausente/inválido/expirado | `ErrorResponse` |
| `403` | Usuario sin permiso `VIEW_INVOICE (5001007)` | `ErrorResponse` |
| `400` | `shortBy` contiene campo no válido (ignorado, se usa default) | — |

### Permisos

- `VIEW_INVOICE (5001007)` — **obligatorio**
- `VIEW_ALL_INVOICE (5001013)` — opcional: sin este permiso, solo se devuelven facturas donde el usuario autenticado es el `salesRep`

---

## 2. Cargar facturas abiertas del usuario

```
GET /sales/invoice/load-open
```

### Entrada

Sin parámetros.

### Response 200 OK

```json
[
  {
    "id": "uuid",
    "draftNumber": "000001",
    "number": null,
    "name": "INV-000001",
    "client": { ... },
    "salesRep": { ... },
    "status": "DRAFT",
    "currency": "USD",
    "totalAmount": 0.00,
    "paidAmount": 0.00,
    "balanceDue": 0.00,
    "dueAt": null,
    "overdue": false,
    "createdAt": "2026-07-30T09:00:00-04:00"
  }
]
```

Mismo schema que `ListInvoiceResponse`, solo que en array plano (no paginado).

### Errores posibles

| Código | Condición | Cuerpo |
|---|---|---|
| `401` | Token ausente/inválido/expirado | `ErrorResponse` |
| `403` | Usuario sin acceso al módulo `INVOICES` | `ErrorResponse` |

### Permisos

- Acceso al módulo `INVOICES` (tener al menos una acción del módulo asignada)

---

## 3. Cerrar todas las facturas abiertas

```
PATCH /sales/invoice/close-list
```

### Entrada

Sin body. Sin parámetros.

### Response 200 OK

```json
{
  "title": "Success",
  "message": "All open invoices have been closed",
  "data": ["uuid-1", "uuid-2", "uuid-3"]
}
```

`data` es la lista de UUIDs de las facturas que se cerraron (puede ser `[]` si no había ninguna abierta).

### Errores posibles

| Código | Condición | Cuerpo |
|---|---|---|
| `401` | Token ausente/inválido/expirado | `ErrorResponse` |
| `403` | Usuario sin acceso al módulo `INVOICES` | `ErrorResponse` |

### Permisos

- Acceso al módulo `INVOICES`

---

## 4. Abrir/bloquear factura

```
PATCH /sales/invoice/open-lock/{invoice_id}?type=EDIT
```

### Entrada

**Path params:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `invoice_id` | `UUID` | ID de la factura |

**Query params:**

| Parámetro | Tipo | Valores | Obligatorio | Descripción |
|---|---|---|---|---|
| `type` | `string` | `VIEW`, `EDIT`, `CREATE` | **Sí** | Tipo de apertura |

### Response 200 OK

```json
{
  "data": {
    "id": "uuid",
    "draftNumber": "000001",
    "number": null,
    "name": "INV-000001",
    "department": "IP",
    "status": "DRAFT",
    "currency": "USD",
    "client": { ... },
    "clientContact": { ... },
    "shipToName": "Nombre Destino",
    "shipToAddress": "Dirección",
    "shipToCity": { "id": "uuid", "name": "Miami" },
    "shipToPhone": "1234567890",
    "shipToContactName": "Contacto",
    "shipToEmail": "correo@ejemplo.com",
    "orderNumber": "ORD-001",
    "via": "SEA",
    "incoterms": "FOB",
    "paymentTerms": "NET_30",
    "awbBl": "BL-001",
    "salesRep": { ... },
    "remarks": "Notas",
    "internalRemarks": "Notas internas",
    "packingList": "PL-001",
    "totalAmount": 15000.00,
    "paidAmount": 0.00,
    "balanceDue": 15000.00,
    "dueAt": null,
    "overdue": false,
    "overdueNotifiedAt": null,
    "issuedAt": null,
    "partialPaidAt": null,
    "paidAt": null,
    "cancelledAt": null,
    "cancelReason": null,
    "pdfUrl": null,
    "openAt": "2026-07-30T10:00:00-04:00",
    "openBy": { "id": "uuid", "fullName": "Juan Pérez", "user": "jperez" },
    "products": [
      {
        "id": "uuid",
        "ipProduct": {
          "id": "uuid",
          "name": "Producto A",
          "description": "Descripción del producto",
          "clientDescription": "Cómo lo llama el cliente",
          "mfrReference": "MFR-123",
          "clientReference": "CLT-REF-123",
          "brand": { "id": "uuid", "name": "Marca X" },
          "coo": { "id": "uuid", "name": "United States" }
        },
        "number": 1,
        "quantity": 100.00000,
        "unitType": "UNITS",
        "leadTime": 15,
        "leadTimeType": "DAYS",
        "unitPrice": 50.00000,
        "profitMargin": 0.25,
        "condition": "NEW",
        "extendedPrice": 5000.00000,
        "sellingUnitPrice": 50.00000,
        "sellingExtendedPrice": 5000.00000
      }
    ],
    "charges": [
      {
        "id": "uuid",
        "description": "Flete internacional",
        "type": "INTERNATIONAL_FREIGHT",
        "value": 500.00000
      }
    ],
    "taxes": [
      {
        "id": "uuid",
        "type": "US_SALES_TAX",
        "description": "Impuesto de ventas USA",
        "rate": 0.0875,
        "taxableBase": 5500.00000,
        "value": 481.25000
      }
    ],
    "linkedPurchaseOrders": [
      {
        "id": "uuid",
        "number": "000123"
      }
    ],
    "productsTotal": 5000.00000,
    "chargesTotal": 500.00000,
    "taxesTotal": 481.25000
  },
  "isValidOpen": true
}
```

- **`isValidOpen = true`**: el usuario puede operar la factura (bloqueo adquirido o ya era suyo)
- **`isValidOpen = false`**: la factura está bloqueada por otro usuario; solo lectura

### Reglas de negocio

| Tipo | Comportamiento |
|---|---|
| `VIEW` | Siempre permite acceso. No valida estado ni bloqueo. |
| `EDIT` | Solo permite en estados `DRAFT`, `ISSUED`, `PARTIAL_PAID`. Valida que no exceda `maxTabsOpen`. Si ya está abierta por otro usuario → `isValidOpen = false`. Si ya está abierta por el mismo usuario → `isValidOpen = true`. |

### Errores posibles

| Código | Condición | Cuerpo |
|---|---|---|
| `401` | Token ausente/inválido/expirado | `ErrorResponse` |
| `403` | Sin acceso al módulo `INVOICES` | `ErrorResponse` |
| `403` | Sin permiso sobre la factura por alcance de vendedor (`VIEW_ALL_INVOICE`) | `ErrorResponse` — `"sales.invoice.access-denied"` |
| `404` | `invoice_id` no existe | `ErrorResponse` — `"sales.invoice.not-exist"` |
| `400` | `type` inválido (no es `VIEW`/`EDIT`/`CREATE`) | `ErrorResponse` |
| `400` | Se excede el máximo de pestañas abiertas | `ErrorResponse` — `"sales.invoice.not-open-max"` |

### Permisos

- Acceso al módulo `INVOICES`
- Aplica alcance por vendedor (`VIEW_ALL_INVOICE`)

---

## 5. Cerrar factura individual

```
PATCH /sales/invoice/close/{invoice_id}
```

### Entrada

**Path params:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `invoice_id` | `UUID` | ID de la factura a cerrar |

Sin body. Sin query params.

> **Solo el dueño del lock puede cerrar.** Si la factura está abierta por otro usuario, la petición
> falla con `sales.invoice.not-block-by` — antes cualquier usuario del módulo podía soltar el lock
> de un compañero. Cerrar una factura que no está abierta, o que está abierta por uno mismo, sigue
> siendo idempotente.

### Response 200 OK

```json
{
  "title": "Success",
  "message": "Invoice has been closed",
  "data": "uuid"
}
```

### Errores posibles

| Código | Condición | Cuerpo |
|---|---|---|
| `400` | La factura está abierta por otro usuario | `ErrorResponse` — `"sales.invoice.not-block-by"` |
| `401` | Token ausente/inválido/expirado | `ErrorResponse` |
| `403` | Sin acceso al módulo `INVOICES` | `ErrorResponse` |
| `404` | `invoice_id` no existe | `ErrorResponse` — `"sales.invoice.not-exist"` |

### Permisos

- Acceso al módulo `INVOICES`

---

## 6. Clonar factura

```
PATCH /sales/invoice/clone/{invoice_id}
```

### Entrada

**Path params:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `invoice_id` | `UUID` | ID de la factura original |

Sin body.

### Response 201 Created

```json
{
  "title": "Success",
  "message": "Invoice has been cloned",
  "data": {
    "id": "uuid",
    "draftNumber": "000002",
    "number": null,
    "name": "INV-000002",
    "client": { ... },
    "salesRep": { ... },
    "status": "DRAFT",
    "currency": "USD",
    "totalAmount": 15000.00,
    "paidAmount": 0.00,
    "balanceDue": 15000.00,
    "dueAt": null,
    "overdue": false,
    "createdAt": "2026-07-30T10:05:00-04:00"
  }
}
```

### Reglas de negocio

- La factura clonada queda en `DRAFT` con nuevo `draftNumber`.
- Se copian: productos, cargos, impuestos, PO's asociados.
- **No se clonan**: pagos, número oficial, fechas de emisión/vencimiento.
- Se registra en `t_invoice_cloned` (trazabilidad origen → clon).
- Se registra en historial con acción `CLONE`.
- Se valida el límite de pestañas abiertas (`maxTabsOpen`).

### Errores posibles

| Código | Condición | Cuerpo |
|---|---|---|
| `401` | Token ausente/inválido/expirado | `ErrorResponse` |
| `403` | Sin permiso `CLONE_INVOICE (5001004)` | `ErrorResponse` |
| `403` | Sin permiso sobre la factura por alcance de vendedor | `ErrorResponse` — `"sales.invoice.access-denied"` |
| `404` | `invoice_id` no existe | `ErrorResponse` — `"sales.invoice.not-exist"` |
| `400` | Se excede el máximo de pestañas abiertas | `ErrorResponse` — `"sales.invoice.not-open-max"` |

### Permisos

- `CLONE_INVOICE (5001004)` — **obligatorio**
- Aplica alcance por vendedor (`VIEW_ALL_INVOICE`)

---

## 7. Obtener historial de factura

```
GET /sales/invoice/{invoice_id}/history
```

### Entrada

**Path params:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `invoice_id` | `UUID` | ID de la factura |

Sin query params.

> **Alcance por vendedor.** Además del permiso `VIEW_HISTORY_INVOICE`, se aplica el mismo filtro que
> el resto del módulo: sin `VIEW_ALL_INVOICE` solo se ve el historial de las facturas propias
> (`sales.invoice.access-denied`). Una factura inexistente devuelve `404`, no una lista vacía.

### Response 200 OK

```json
[
  {
    "id": "uuid",
    "user": {
      "id": "uuid",
      "fullName": "Juan Pérez",
      "user": "jperez"
    },
    "action": "ISSUE",
    "createdAt": "2026-07-28T14:00:00-04:00",
    "data": {
      "status": { "old": "DRAFT", "new": "ISSUED" },
      "issuedAt": { "new": "2026-07-28T14:00:00-04:00" },
      "dueAt": { "new": "2026-08-27T23:59:59-04:00" }
    }
  },
  {
    "id": "uuid",
    "user": { ... },
    "action": "CREATE",
    "createdAt": "2026-07-25T09:00:00-04:00",
    "data": { ... }
  }
]
```

`action` puede ser cualquiera del enum `InvoiceHistoryAction`:
`CREATE`, `UPDATE`, `CLONE`, `ISSUE`, `CANCEL`, `REVERT_TO_DRAFT`, `ADD_PRODUCT`, `REMOVE_PRODUCT`, `UPDATE_PRODUCT`, `ADD_CHARGE`, `REMOVE_CHARGE`, `UPDATE_CHARGE`, `ADD_TAX`, `REMOVE_TAX`, `UPDATE_TAX`, `REGISTER_PAYMENT`, `VOID_PAYMENT`

`data` es un JSON dinámico con los cambios (`old`/`new`) o el snapshot completo según la acción.

### Errores posibles

| Código | Condición | Cuerpo |
|---|---|---|
| `401` | Token ausente/inválido/expirado | `ErrorResponse` |
| `403` | Sin permiso `VIEW_HISTORY_INVOICE (5001003)` | `ErrorResponse` |
| `403` | Sin alcance sobre la factura (no es su `salesRep` y no tiene `VIEW_ALL_INVOICE`) | `ErrorResponse` — `"sales.invoice.access-denied"` |
| `404` | `invoice_id` no existe | `ErrorResponse` — `"sales.invoice.not-exist"` |

### Permisos

- `VIEW_HISTORY_INVOICE (5001003)` — **obligatorio**
- Alcance por vendedor: `VIEW_ALL_INVOICE (5001013)` o ser el `salesRep` de la factura

---

## 8. Listas desplegables de factura (UtilController)

```
GET /common/static_lists
```

Endpoint genérico que devuelve **todas** las listas estáticas del sistema. Para el módulo de facturación se usan 3:

| `name` (key) | Enum Java | Uso |
|---|---|---|
| `invoice_status` | `InvoiceStatus` | Estado de la factura (listados, badges, filtros) |
| `invoice_tax_type` | `InvoiceTaxType` | Tipos de impuestos (sección impuestos del form) |
| `invoice_charge_type` | `InvoiceChargeType` | Tipos de cargos (sección other charges del form) |

### Entrada

Sin parámetros. Sin autenticación por acción (solo requiere JWT válido).

### Response 200 OK

```json
[
  { "name": "client_status", "items": [ ... ] },
  { "name": "supplier_status", "items": [ ... ] },
  { "name": "payment_terms", "items": [ ... ] },
  { "name": "payment_methods", "items": [ ... ] },
  { "name": "currency", "items": [ ... ] },
  { "name": "unit_type", "items": [ ... ] },
  { "name": "incoterms", "items": [ ... ] },
  { "name": "invoice_status", "items": [ ... ] },
  { "name": "invoice_tax_type", "items": [ ... ] },
  { "name": "invoice_charge_type", "items": [ ... ] }
]
```

Cada ítem sigue el formato `EnumItem`:

```json
{ "key": "PARTIAL_PAID", "value": "PARTIAL PAID" }
```

Donde `key` es el valor que se envía al backend (filtros, request bodies) y `value` es el texto a mostrar en la UI.

### Listas para Invoice

**`invoice_status`**

| key | value (display) |
|---|---|
| `DRAFT` | `DRAFT` |
| `ISSUED` | `ISSUED` |
| `PARTIAL_PAID` | `PARTIAL PAID` |
| `PAID` | `PAID` |
| `CANCELLED` | `CANCELLED` |

**`invoice_tax_type`**

| key | value (display) |
|---|---|
| `US_SALES_TAX` | `US SALES TAX` |
| `COLOMBIA_IVA` | `COLOMBIA IVA` |
| `WITHHOLDING_TAX` | `WITHHOLDING TAX` |
| `VAT` | `VAT` |
| `GST` | `GST` |
| `EXPORT_TAX_EXEMPT` | `EXPORT TAX EXEMPT` |
| `OTHER` | `OTHER` |

**`invoice_charge_type`**

| key | value (display) |
|---|---|
| `INTERNATIONAL_FREIGHT` | `INTERNATIONAL FREIGHT` |
| `LOCAL_FREIGHT` | `LOCAL FREIGHT` |
| `INSURANCE` | `INSURANCE` |
| `WIRE_TRANSFER_FEE` | `WIRE TRANSFER FEE` |
| `CUSTOMS_DUTIES` | `CUSTOMS DUTIES` |
| `CUSTOMS_BROKERAGE_FEE` | `CUSTOMS BROKERAGE FEE` |
| `HANDLING_FEE` | `HANDLING FEE` |
| `PACKING_FEE` | `PACKING FEE` |
| `STORAGE_FEE` | `STORAGE FEE` |
| `INSPECTION_FEE` | `INSPECTION FEE` |
| `BANK_FEE` | `BANK FEE` |
| `DISCOUNT` | `DISCOUNT` |
| `OTHER` | `OTHER` |

> **Recomendación frontend:** consumir el endpoint una sola vez y cachear por lista (`Map<name, items>`), ya que devuelve todos los enums del sistema (clientes, proveedores, productos, etc.), no solo los de invoice.

### Errores posibles

| Código | Condición | Cuerpo |
|---|---|---|
| `401` | Token ausente/inválido/expirado | `ErrorResponse` |

### Permisos

- Solo requiere autenticación (JWT válido). Sin acción específica.

---

## 9. Crear factura (draft)

```
POST /sales/invoice
```

Crea una factura en estado `DRAFT` y queda **bloqueada por el usuario autenticado** (quien la crea es también su `salesRep`).

### Entrada (body JSON)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `clientId` | `UUID` | **Sí** | Cliente a facturar |
| `clientContactId` | `UUID` | No | Contacto del cliente; si no se envía, se usa el contacto principal activo del departamento |
| `incoterms` | `enum` | **Sí** | `FOB`, `CIF`, `EXW`, etc. (enum `Incoterms`) |
| `currency` | `enum` | No | Default `USD` |
| `department` | `enum` | No | Default `IP` (`ConsecutiveDepartment`) |
| `via` | `enum` | No | `BL` o `AWB` (`InvoiceVia`) |
| `orderNumber` | `string` | No | Máx. 100 caracteres |
| `awbBl` | `string` | No | Máx. 100 caracteres |
| `remarks` | `string` | No | Notas visibles |
| `internalRemarks` | `string` | No | Notas internas |
| `packingList` | `string` | No | Máx. 100 caracteres |

> **Nota:** el bloque ship-to **no se recibe** en create — se copia automáticamente del cliente (datos de envío denormalizados). `salesRep`, `status` y `draftNumber` los asigna el servidor.

**Ejemplo:**

```json
{
  "clientId": "uuid",
  "clientContactId": "uuid",
  "incoterms": "FOB",
  "currency": "USD",
  "department": "IP",
  "via": "BL",
  "orderNumber": "ORD-001",
  "awbBl": "BL-001",
  "remarks": "Notas visibles",
  "internalRemarks": "Notas internas",
  "packingList": "PL-001"
}
```

### Lógica del servidor

1. **Validar límite de pestañas abiertas** (`maxTabsOpen`) → si se excede, error `sales.invoice.not-open-max`.
2. **Resolver departamento** (default `IP`) y **moneda** (default `USD`).
3. **Cargar cliente y contacto**: si `clientContactId` viene null, se resuelve el contacto principal activo del cliente para el departamento.
4. **Validar que el cliente sea "facturable"** (`ClientNotInvoiceable`): dirección, ciudad, contacto y teléfono de contacto. Si falta algo, error `sales.invoice.client-incomplete` con la lista de campos faltantes.
5. **Asignar número de borrador** (`draftNumber`) desde el consecutivo `DRAFT_INV`.
6. **Inicializar el draft**: `status = DRAFT`, `totalAmount = 0`, `paidAmount = 0`, `overdue = false`, `openAt`/`openBy` = usuario autenticado (queda bloqueada para editar).
7. **Copiar bloque ship-to desde el cliente** (snapshot denormalizado: nombre, dirección, ciudad, teléfono, contacto, email).
8. **`paymentTerms` inicial**: los del cliente; si el cliente no tiene, `TO_BE_AGREED` (deja `dueAt` en null y fuera del cálculo de overdue).
9. **Registrar historial** con acción `CREATE`.

### Response 201 Created

```json
{
  "title": "Success",
  "message": "Invoice has been created",
  "data": {
    "data": {
      "id": "uuid",
      "draftNumber": "000001",
      "number": null,
      "name": "INV-000001",
      "department": "IP",
      "status": "DRAFT",
      "currency": "USD",
      "client": { ... },
      "clientContact": { ... },
      "shipToName": "...",
      "shipToAddress": "...",
      "shipToCity": { ... },
      "shipToPhone": "...",
      "shipToContactName": "...",
      "shipToEmail": "...",
      "orderNumber": "...",
      "via": "BL",
      "incoterms": "FOB",
      "paymentTerms": "TO_BE_AGREED",
      "awbBl": "...",
      "salesRep": { ... },
      "remarks": "...",
      "internalRemarks": "...",
      "packingList": "...",
      "totalAmount": 0.00000,
      "paidAmount": 0.00000,
      "balanceDue": 0.00000,
      "dueAt": null,
      "overdue": false,
      "overdueNotifiedAt": null,
      "issuedAt": null,
      "partialPaidAt": null,
      "paidAt": null,
      "cancelledAt": null,
      "cancelReason": null,
      "pdfUrl": null,
      "openAt": "2026-07-30T10:00:00-04:00",
      "openBy": { ... },
      "products": [],
      "charges": [],
      "taxes": [],
      "linkedPurchaseOrders": [],
      "productsTotal": 0.00000,
      "chargesTotal": 0.00000,
      "taxesTotal": 0.00000
    },
    "isValidOpen": true
  }
}
```

`isValidOpen = true` siempre: el usuario que creó ya tiene el bloqueo de edición. Las listas `products`, `charges`, `taxes`, `linkedPurchaseOrders` llegan vacías en la creación; se poblean al agregar líneas y productos a la factura.

### Errores posibles

| Código | Condición | Cuerpo |
|---|---|---|
| `401` | Token ausente/inválido/expirado | `ErrorResponse` |
| `403` | Sin permiso `CREATE_INVOICE (5001001)` | `ErrorResponse` |
| `400` | Validación `@Valid` falla (campos obligatorios, tamaños) | `ErrorResponse` con `formErrors` |
| `400` | Cliente incompleto para facturar | `ErrorResponse` — `"sales.invoice.client-incomplete"` |
| `400` | Se excede el máximo de pestañas abiertas | `ErrorResponse` — `"sales.invoice.not-open-max"` |
| `404` | `clientId` no existe | `ErrorResponse` |

### Permisos

- `CREATE_INVOICE (5001001)` — **obligatorio**

---

## 10. Actualizar factura (draft)

```
PUT /sales/invoice/{invoice_id}
```

Edita el encabezado de la factura. Nunca toca numeración, status, departamento, montos ni timestamps
de ciclo de vida.

**Dos modos según el estado:**

| Estado | Comportamiento |
|---|---|
| `DRAFT` | Se aplica el body completo, como siempre |
| `ISSUED` | Modo restringido: solo se aplican `internalRemarks`, `remarks`, `orderNumber`, `awbBl` y `packingList` |
| Otro | `400 sales.invoice.not-editable` |

En modo restringido, cualquier **cambio real** en un campo financiero o estructural (`clientId`,
`clientContactId`, `currency`, `incoterms`, `via`, `paymentTerms`, `salesRepId`, `shipTo*`) se
rechaza con `sales.invoice.issued-restricted-field` nombrando el campo. Reenviar los valores
actuales — que es lo que hace el frontend al mandar el formulario completo — no falla; solo falla un
cambio efectivo. Los line items (productos, cargos, impuestos) siguen bloqueados fuera de `DRAFT`.

### Entrada

**Path params:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `invoice_id` | `UUID` | ID de la factura a editar |

**Body JSON:**

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `clientId` | `UUID` | **Sí** | Cliente |
| `clientContactId` | `UUID` | No | Contacto del cliente |
| `incoterms` | `enum` | **Sí** | `Incoterms` |
| `currency` | `enum` | **Sí** | `Currency` |
| `via` | `enum` | No | `BL` / `AWB` |
| `paymentTerms` | `enum` | No | **Permiso-gated**: requiere `EDIT_PAYMENT_TERMS_INVOICE`; si no se tiene, gana el del cliente |
| `salesRepId` | `UUID` | No | **Permiso-gated**: requiere `CHANGE_SALES_REP_INVOICE` si cambia |
| `shipToName` | `string` | **Sí** | Máx. 300 |
| `shipToAddress` | `string` | **Sí** | Máx. 500 |
| `shipToCityId` | `UUID` | **Sí** | Ciudad de envío |
| `shipToPhone` | `string` | **Sí** | Máx. 50 |
| `shipToContactName` | `string` | **Sí** | Máx. 255 |
| `shipToEmail` | `string` | **Sí** | Formato email, máx. 150 |
| `orderNumber` | `string` | No | Máx. 100 |
| `awbBl` | `string` | No | Máx. 100 |
| `remarks` | `string` | No | |
| `internalRemarks` | `string` | No | |
| `packingList` | `string` | No | Máx. 100 |

**Ejemplo:**

```json
{
  "clientId": "uuid",
  "clientContactId": "uuid",
  "incoterms": "FOB",
  "currency": "USD",
  "via": "BL",
  "paymentTerms": "NET_30",
  "salesRepId": "uuid",
  "shipToName": "Nombre Destino",
  "shipToAddress": "Dirección",
  "shipToCityId": "uuid",
  "shipToPhone": "1234567890",
  "shipToContactName": "Contacto",
  "shipToEmail": "correo@ejemplo.com",
  "orderNumber": "ORD-001",
  "awbBl": "BL-001",
  "remarks": "Notas",
  "internalRemarks": "Notas internas",
  "packingList": "PL-001"
}
```

### Lógica del servidor

1. **Buscar factura** → `404` si no existe (`sales.invoice.not-exist`).
2. **Guard de acceso por vendedor**: sin `VIEW_ALL_INVOICE`, solo el `salesRep` puede editar → `403`/`400` (`sales.invoice.access-denied`).
3. **Guard de estado editable**: `DRAFT` (completo) o `ISSUED` (restringido a los cinco campos no financieros); cualquier otro → `400` (`sales.invoice.not-editable`). `PARTIAL_PAID` solo acepta pagos; `PAID` solo anulación de pagos; `CANCELLED` es final.
4. **Guard de bloqueo**: la factura debe estar abierta por el usuario autenticado → `400` (`sales.invoice.not-block` si nadie la tiene abierta, `sales.invoice.not-block-by` si la tiene otro usuario — con el nombre de quién la bloquea).
5. **Snapshot previo** para el diff del historial.
6. **Cambio de cliente** (si `clientId` difiere): valida que el nuevo cliente sea facturable y re-deriva sus datos; el frontend debe recargar el ship-to del nuevo cliente.
7. **Ship-to**: se toma **siempre del request** (no hay autofill en update).
8. **Moneda, incoterms, via**: se actualizan directamente.
9. **Payment terms**: primero se aplican los del cliente (los del cliente ganan por defecto). Solo se aplica el `paymentTerms` del request si el usuario tiene `EDIT_PAYMENT_TERMS_INVOICE (5001006)`.
10. **Sales rep**: si `salesRepId` es null o es el mismo que el actual, se ignora (el frontend suele hacer echo del vendedor actual y eso no debe fallar sin permiso). Si cambia, requiere `CHANGE_SALES_REP_INVOICE (5001014)` → si no, `400` (`sales.invoice.sales-rep-not-allowed`).
11. **Historial**: acción `UPDATE` con solo los campos que cambiaron.

### Response 200 OK

```json
{
  "title": "Success",
  "message": "Invoice has been updated",
  "data": {
    "id": "uuid",
    "draftNumber": "000001",
    "number": null,
    "name": "INV-000001",
    "department": "IP",
    "status": "DRAFT",
    "currency": "USD",
    "client": { ...InvoiceClientResponse... },
    "clientContact": { ...ClientContactResponse... },
    "shipToName": "Nombre actualizado",
    "shipToAddress": "Dirección actualizada",
    "shipToCity": { "id": "uuid", "name": "Miami" },
    "shipToPhone": "1234567890",
    "shipToContactName": "Contacto",
    "shipToEmail": "correo@ejemplo.com",
    "orderNumber": "ORD-001",
    "via": "BL",
    "incoterms": "FOB",
    "paymentTerms": "NET_30",
    "awbBl": "BL-001",
    "salesRep": { ...BasicUserResponse... },
    "remarks": "Notas actualizadas",
    "internalRemarks": "Notas internas actualizadas",
    "packingList": "PL-001",
    "totalAmount": 0.00000,
    "paidAmount": 0.00000,
    "balanceDue": 0.00000,
    "dueAt": null,
    "overdue": false,
    "overdueNotifiedAt": null,
    "issuedAt": null,
    "partialPaidAt": null,
    "paidAt": null,
    "cancelledAt": null,
    "cancelReason": null,
    "pdfUrl": null,
    "openAt": "2026-07-30T10:00:00-04:00",
    "openBy": { ...BasicUserResponse... },
    "products": [ { ...InvoiceProductResponse... } ],
    "charges": [ { ...InvoiceChargeResponse... } ],
    "taxes": [ { ...InvoiceTaxResponse... } ],
    "linkedPurchaseOrders": [ { "id": "uuid", "number": "000123" } ],
    "productsTotal": 5000.00000,
    "chargesTotal": 500.00000,
    "taxesTotal": 481.25000
  }
}
```

### Errores posibles

| Código | Condición | Cuerpo |
|---|---|---|
| `401` | Token ausente/inválido/expirado | `ErrorResponse` |
| `403` | Sin permiso `UPDATE_INVOICE (5001002)` | `ErrorResponse` |
| `403` | Sin alcance sobre la factura (no es su `salesRep` y no tiene `VIEW_ALL_INVOICE`) | `ErrorResponse` — `"sales.invoice.access-denied"` |
| `404` | `invoice_id` no existe | `ErrorResponse` — `"sales.invoice.not-exist"` |
| `400` | Factura no está en `DRAFT` ni en `ISSUED` | `ErrorResponse` — `"sales.invoice.not-editable"` |
| `400` | Factura en `ISSUED` y el body cambia un campo financiero o estructural | `ErrorResponse` — `"sales.invoice.issued-restricted-field"` con el nombre del campo |
| `400` | Factura no está bloqueada o la bloquea otro usuario | `ErrorResponse` — `"sales.invoice.not-block"` / `"sales.invoice.not-block-by"` |
| `400` | Validación `@Valid` falla (ship-to obligatorio, email inválido, tamaños) | `ErrorResponse` con `formErrors` |
| `400` | Cambio de cliente a uno incompleto | `ErrorResponse` — `"sales.invoice.client-incomplete"` |
| `400` | Cambio de `salesRep` sin permiso `CHANGE_SALES_REP_INVOICE` | `ErrorResponse` — `"sales.invoice.sales-rep-not-allowed"` |
| `400` | `shipToCityId` no existe | `ErrorResponse` |

### Permisos

- `UPDATE_INVOICE (5001002)` — **obligatorio**
- `VIEW_ALL_INVOICE (5001013)` — condicional: sin él solo se editan facturas donde es `salesRep`
- `EDIT_PAYMENT_TERMS_INVOICE (5001006)` — opcional: necesario para sobrescribir los payment terms del cliente
- `CHANGE_SALES_REP_INVOICE (5001014)` — opcional: necesario para reasignar el vendedor

---

## Sub-recursos de la factura (line items)

Los productos, cargos, impuestos y PO's vinculadas se gestionan con controllers propios bajo la ruta
de la factura padre, no dentro del payload de `PUT /sales/invoice/{id}`.

**Reglas comunes a todas las mutaciones de sub-recursos:**

- La factura debe estar **abierta y bloqueada por el usuario** (`PATCH /open-lock/{id}` primero); si
  no, `400 sales.invoice.not-block` / `sales.invoice.not-block-by`.
- Solo se permiten en estado **`DRAFT`**; en otro estado, `400 sales.invoice.not-editable`.
- Aplican el alcance por vendedor: sin `VIEW_ALL_INVOICE` y sin ser el `salesRep`, `403
  sales.invoice.access-denied`.
- Permiso: `@AccessToAction(UPDATE_INVOICE)` en todos los endpoints.
- Tras cada add/edit/delete/import de productos, cargos o impuestos se **recalcula y persiste**
  `total_amount = SUM(productos) + SUM(charges) + SUM(taxes)`. Vincular/desvincular PO's **no**
  altera totales (es solo trazabilidad).

---

## 11. Productos de la factura

Base: `/sales/invoice/{invoice_id}/product`

> **Precio.** `unitPrice` es el **costo** y `profitMargin` el **margen** (fracción, ej. `0.30` = 30%).
> `extendedPrice` es el costo total de la línea (`quantity × unitPrice`), sin margen — solo display.
> `sellingUnitPrice` es el precio de venta unitario (`unitPrice × (1 + profitMargin / 100)`).
> `sellingExtendedPrice` es el precio de venta total (`quantity × sellingUnitPrice`) y se usa para
> el `productsTotal` y `totalAmount` de la factura.

### 11.1 Agregar producto — `POST /sales/invoice/{invoice_id}/product`

Request body:

```json
{
  "productId": "uuid",
  "quantity": 100.00000,
  "unitType": "PCS",
  "leadTime": 4,
  "leadTimeType": "WEEKS",
  "unitPrice": 50.00000,
  "profitMargin": 0.30,
  "condition": "NEW"
}
```

`leadTime` y `leadTimeType` son opcionales (default `0` / `WEEKS`). El `number` de línea lo asigna el
servidor. **Un mismo `productId` no puede repetirse** en la factura (`400
sales.invoice.product.exist`).

Response `201 Created`:

```json
{
  "title": "Success",
  "message": "The product has been successfully added to the Invoice",
  "data": {
    "id": "uuid",
    "ipProduct": { "id": "uuid", "code": "PRD-001", "description": "...", "brand": { }, "coo": { } },
    "number": 1,
    "quantity": 100.00000,
    "unitType": "PCS",
    "leadTime": 4,
    "leadTimeType": "WEEKS",
    "unitPrice": 50.00000,
    "profitMargin": 0.30,
    "condition": "NEW",
    "extendedPrice": 5000.00000,
    "sellingUnitPrice": 65.00000,
    "sellingExtendedPrice": 6500.00000
  }
}
```

### 11.2 Editar producto — `PUT /sales/invoice/{invoice_id}/product/{product_id}`

Mismo body que 11.1. Responde `200 OK` con la línea actualizada. El `product_id` de la URL es el id
de la **línea de factura**, no del producto de catálogo.

### 11.3 Ver producto — `GET /sales/invoice/{invoice_id}/product/{product_id}`

Responde `200 OK` con la línea (mismo shape que `data` en 11.1, sin envoltura `MessageResponse`).

### 11.4 Eliminar producto — `DELETE /sales/invoice/{invoice_id}/product/{product_id}`

Response `200 OK`:

```json
{ "title": "Success", "message": "The product has been successfully removed from the Invoice", "data": "uuid" }
```

### 11.5 Importar productos desde un PO — `POST /sales/invoice/{invoice_id}/product/import-from-po`

Copia líneas de un PO **ya vinculado** a la factura (ver §14). Los datos se copian, no se referencian.

Request body:

```json
{ "poId": "uuid", "poProductIds": ["uuid", "uuid"] }
```

- Copia por línea: `productId`, `quantity`, `unitType`, `leadTime`/`leadTimeType` desde el QR;
  `profitMargin` y `condition` desde la Quotation; `unitPrice` = costo del QR.
- Se **saltan** los `productId` ya presentes en la factura.
- Si el `poId` no está vinculado: `400 sales.invoice.po.not-linked`.

Response `201 Created` con `data` = lista de líneas creadas (shape de 11.1).

### 11.6 Listar productos disponibles de POs vinculadas — `GET /sales/invoice/{invoice_id}/product/available-from-pos`

Devuelve todos los productos de las POs vinculadas que **aún no están importados** en la factura
(se compara por `productId`). Usar `poProductId` en `poProductIds` del endpoint 11.5 para importar
los seleccionados.

**Permiso:** `VIEW_INVOICE`. Solo lectura; no requiere lock.

Response `200 OK` — array plano, puede estar vacío:

```json
[
  {
    "poId": "uuid",
    "poNumber": "IP-2026-001",
    "poProductId": "uuid",
    "productId": "uuid",
    "productDescription": "Transistor NPN",
    "productMfrReference": "2N2222A",
    "quantity": 500.00000,
    "unitType": "PCS",
    "leadTime": 4,
    "leadTimeType": "WEEKS",
    "unitPrice": 0.85000,
    "profitMargin": 0.30000,
    "condition": "NEW"
  }
]
```

> Productos cuyo QR no tiene `ipProduct` asociado se omiten silenciosamente (datos incompletos en la cadena QR→Q→PO).

### Errores posibles (§11)

| Código | Mensaje | Causa |
|---|---|---|
| 400 | `sales.invoice.product.exist` | El producto ya está en la factura |
| 400 | `sales.invoice.product.not-exist` | La línea no existe en la factura |
| 400 | `sales.invoice.po.not-linked` | El PO a importar no está vinculado |
| 400 | `sales.invoice.not-editable` | La factura no está en `DRAFT` |
| 400 | `sales.invoice.not-block` / `not-block-by` | La factura no está bloqueada por el usuario |
| 403 | `sales.invoice.access-denied` | No es el `salesRep` y no tiene `VIEW_ALL_INVOICE` |
| 404 | `sales.invoice.not-exist` | La factura no existe |

---

## 12. Charges de la factura

Base: `/sales/invoice/{invoice_id}/charge`

### 12.1 Crear charge — `POST /sales/invoice/{invoice_id}/charge`

Request body (todos requeridos; `value` admite negativo para `DISCOUNT`):

```json
{ "description": "International freight", "type": "INTERNATIONAL_FREIGHT", "value": 500.00000 }
```

Response `201 Created`:

```json
{
  "title": "Success",
  "message": "The charge has been successfully added to the Invoice",
  "data": { "id": "uuid", "description": "International freight", "type": "INTERNATIONAL_FREIGHT", "value": 500.00000 }
}
```

### 12.2 Editar / Ver / Eliminar

- `PUT /sales/invoice/{invoice_id}/charge/{charge_id}` — mismo body, `200 OK`.
- `GET /sales/invoice/{invoice_id}/charge/{charge_id}` — `200 OK` con el charge.
- `DELETE /sales/invoice/{invoice_id}/charge/{charge_id}` — `200 OK`, `data` = id del charge.

### 12.3 Importar charges desde un PO — `POST /sales/invoice/{invoice_id}/charge/import-from-po`

Request body:

```json
{ "poId": "uuid" }
```

- Importa **todos** los other charges del PO (propios + importados de Quotation + de QR) como charges
  con `type = OTHER` (el PO no clasifica sus cargos; se reclasifican editando).
- El `salesTax` del PO (si > 0) se importa como un **registro en taxes** (`type = US_SALES_TAX`,
  `rate = 0`, `taxableBase = 0`, `value = salesTax`), no como charge.
- Requiere el PO **vinculado** (`400 sales.invoice.po.not-linked`).

Response `201 Created` con `data` = lista de charges creados. El tax generado por `salesTax` no
aparece en esta lista; se ve al recargar el detalle de la factura.

### 12.4 Listar charges disponibles de POs vinculadas — `GET /sales/invoice/{invoice_id}/charge/available-from-pos`

Devuelve todos los charges de las POs vinculadas. **Sin filtro de duplicados** — el mismo cargo puede
aparecer múltiples veces si el usuario lo importa manualmente varias veces. Usar para previsualizar
qué se va a importar antes de llamar al endpoint 12.3.

**Permiso:** `VIEW_INVOICE`. Solo lectura; no requiere lock.

El campo `source` indica el origen del cargo dentro del PO:

| Valor | Origen |
|---|---|
| `OWN` | Cargo propio del PO |
| `QUOTATION` | Cargo importado desde la Quotation |
| `QUOTATION_QR` | Cargo importado desde el QR vía Quotation |
| `SALES_TAX` | El `salesTax` del encabezado del PO — se importará como **tax**, no como charge (ver §12.3) |

Response `200 OK` — array plano, puede estar vacío:

```json
[
  {
    "poId": "uuid",
    "poNumber": "IP-2026-001",
    "description": "International freight",
    "value": 850.00000,
    "source": "OWN"
  },
  {
    "poId": "uuid",
    "poNumber": "IP-2026-001",
    "description": "Handling fee",
    "value": 120.00000,
    "source": "QUOTATION"
  },
  {
    "poId": "uuid",
    "poNumber": "IP-2026-001",
    "description": "Sales Tax",
    "value": 75.00000,
    "source": "SALES_TAX"
  }
]
```

> Las filas `SALES_TAX` son informativas. Al ejecutar `import-from-po` (§12.3), ese valor llega como
> un registro en `taxes`, no como charge.

### Errores posibles (§12)

| Código | Mensaje | Causa |
|---|---|---|
| 400 | `sales.invoice.charge.not-exist` | El charge no existe en la factura |
| 400 | `sales.invoice.po.not-linked` | El PO a importar no está vinculado |
| 400 | `sales.invoice.not-editable` / `not-block` / `not-block-by` | Estado o lock inválido |
| 403 | `sales.invoice.access-denied` | Alcance por vendedor |
| 404 | `sales.invoice.not-exist` | La factura no existe |

---

## 13. Taxes de la factura

Base: `/sales/invoice/{invoice_id}/tax`

> Los impuestos se ingresan **manualmente**. El frontend precarga el subtotal como conveniencia,
> pero el backend recibe y persiste `rate`, `taxableBase` y `value` tal cual — **no** recalcula el
> valor ni lo acopla al subtotal de productos.

### 13.1 Crear tax — `POST /sales/invoice/{invoice_id}/tax`

Request body:

```json
{
  "type": "US_SALES_TAX",
  "description": "US Sales Tax NY",
  "rate": 0.0875,
  "taxableBase": 5500.00000
}
```

> **`value` no se envía.** El backend lo calcula como `taxableBase * rate` con `BigDecimal`
> (escala 5, HALF_UP) y lo devuelve ya resuelto. La base gravable sí la decide el frontend: el
> backend no la deriva del subtotal de productos.

Response `201 Created`:

```json
{
  "title": "Success",
  "message": "The tax has been successfully added to the Invoice",
  "data": {
    "id": "uuid", "type": "US_SALES_TAX", "description": "US Sales Tax NY",
    "rate": 0.0875, "taxableBase": 5500.00000, "value": 481.25000
  }
}
```

### 13.2 Editar / Ver / Eliminar

- `PUT /sales/invoice/{invoice_id}/tax/{tax_id}` — mismo body, `200 OK`.
- `GET /sales/invoice/{invoice_id}/tax/{tax_id}` — `200 OK` con el tax.
- `DELETE /sales/invoice/{invoice_id}/tax/{tax_id}` — `200 OK`, `data` = id del tax.

No hay importación de taxes (salvo el `salesTax` que trae el import de charges, §12.3).

### Errores posibles (§13)

| Código | Mensaje | Causa |
|---|---|---|
| 400 | `sales.invoice.tax.not-exist` | El tax no existe en la factura |
| 400 | `sales.invoice.not-editable` / `not-block` / `not-block-by` | Estado o lock inválido |
| 403 | `sales.invoice.access-denied` | Alcance por vendedor |
| 404 | `sales.invoice.not-exist` | La factura no existe |

---

## 14. Purchase Orders vinculadas

Base: `/sales/invoice/{invoice_id}/purchase-order`

Registro de trazabilidad ("¿qué PO's componen esta factura?"). La factura queda funcionalmente
desacoplada del PO; vincular es requisito previo para importar sus productos/charges (§11.5, §12.3).
**No** modifica totales.

### 14.1 Vincular PO(s) — `POST /sales/invoice/{invoice_id}/purchase-order`

Request body:

```json
{ "poIds": ["uuid", "uuid"] }
```

Los `poId` ya vinculados se saltan (la clave compuesta `(invoice, po)` impide duplicados).

Response `201 Created`:

```json
{
  "title": "Success",
  "message": "The Purchase Orders have been successfully linked to the Invoice",
  "data": [ { "id": "uuid", "number": "000123" } ]
}
```

### 14.2 Desvincular PO — `DELETE /sales/invoice/{invoice_id}/purchase-order/{po_id}`

`{po_id}` es el id del PO. Response `200 OK`:

```json
{ "title": "Success", "message": "The Purchase Order has been successfully unlinked from the Invoice", "data": "uuid" }
```

### Errores posibles (§14)

| Código | Mensaje | Causa |
|---|---|---|
| 400 | `sales.invoice.po.not-linked` | El PO a desvincular no está vinculado |
| 400 | `sales.invoice.not-editable` / `not-block` / `not-block-by` | Estado o lock inválido |
| 403 | `sales.invoice.access-denied` | Alcance por vendedor |
| 404 | `sales.invoice.not-exist` / `ip.po.not-exist` | Factura o PO inexistente |

---

## 15. Ciclo de vida de la factura (estados)

Todas las transiciones manuales pasan por un único punto (`InvoiceTransitionGuard`); ningún
endpoint escribe `status` por su cuenta. Matriz vigente:

| Desde | Hacia permitido |
|---|---|
| `DRAFT` | `ISSUED`, `CANCELLED` |
| `ISSUED` | `DRAFT` (revert), `PARTIAL_PAID`, `PAID`, `CANCELLED` |
| `PARTIAL_PAID` | `ISSUED` (al anular todos los pagos), `PAID` |
| `PAID` | `PARTIAL_PAID`, `ISSUED` (al anular pagos) |
| `CANCELLED` | — (final) |

`PARTIAL_PAID` y `PAID` **no se piden**: se derivan del monto pagado (§16). Los tres endpoints de
esta sección requieren, además del permiso, que el usuario sea el `salesRep` de la factura y que la
tenga abierta con lock (`PATCH /open-lock/{id}?type=EDIT`).

### 15.1 Emitir factura — `PATCH /sales/invoice/{invoice_id}/issue`

```
PATCH /sales/invoice/{invoice_id}/issue
```

Sin body.

**Lógica del servidor**

1. Valida transición `DRAFT → ISSUED`.
2. Recalcula y **congela** `totalAmount` (productos + charges + taxes).
3. Valida precondiciones: ≥1 producto, `totalAmount > 0`, y cliente/contacto facturable.
4. Si `number` es `null`, toma el consecutivo final `INV` (arranca en 1000). Si la factura ya tenía
   `number` (draft revertido), **lo conserva**.
5. `issuedAt = now`, `dueAt` calculado según `paymentTerms` (ver tabla abajo), `isOverdue = false`,
   `overdueNotifiedAt = null`, `status = ISSUED`.
6. Registra el evento `ISSUE` en el historial con el diff.

**Cálculo de `dueAt` según `paymentTerms`**

| Términos | Fórmula |
|---|---|
| `NET_5` … `NET_180` | `issuedAt + N días` |
| `NET_15TH_PROX`, `NET_20TH_PROX`, `NET_30TH_PROX` | día N del mes siguiente (recortado al último día en meses cortos) |
| `NET_30_END_OF_THE_MONTH`, `NET_60_END_OF_THE_MONTH` | último día del mes de emisión + N días |
| `DUE_UPON_RECEIPT`, `COD` | `issuedAt` |
| `ADVANCED`, `PRIOR_TO_SHIPMENT`, `W_DOCUMENTS`, `TO_BE_AGREED` | `dueAt = null` (no entra al cálculo de vencidas) |

**Response 200 OK** — `MessageResponse<InvoiceResponse>` (mismo schema del detalle de factura):

```json
{
  "title": "Success",
  "message": "The Invoice has been successfully issued",
  "data": {
    "id": "3f2a...",
    "draftNumber": "000012",
    "number": "001000",
    "status": "ISSUED",
    "totalAmount": 15400.00000,
    "paidAmount": 0.00000,
    "balanceDue": 15400.00000,
    "issuedAt": "2026-08-10T14:05:31-04:00",
    "dueAt": "2026-09-09T14:05:31-04:00",
    "isOverdue": false,
    "pdfUrl": null
  }
}
```

> `pdfUrl` sigue en `null`: la generación del PDF es una fase aparte.

### 15.2 Revertir a borrador — `PATCH /sales/invoice/{invoice_id}/revert-to-draft`

```
PATCH /sales/invoice/{invoice_id}/revert-to-draft
```

Sin body. Solo desde `ISSUED` y **solo si la factura no tiene pagos vigentes**.

**Lógica del servidor**

- `status = DRAFT`; `issuedAt`, `dueAt`, `overdueNotifiedAt` y `pdfUrl` se limpian a `null`;
  `isOverdue = false`.
- **`number` se conserva** — queda reservado para siempre en esa factura. Desde este momento la
  factura es un "draft bloqueado": es editable pero **ya no se puede eliminar**. El mensaje de
  respuesta lo advierte explícitamente para mostrarlo al usuario.
- Al volver a emitir, reutiliza ese mismo `number` y recalcula `issuedAt`/`dueAt`.

**Response 200 OK** — `MessageResponse<InvoiceResponse>`, mensaje
`The Invoice has been reverted to Draft, its number stays reserved and it can no longer be deleted`.

### 15.3 Cancelar factura — `PATCH /sales/invoice/{invoice_id}/cancel`

```
PATCH /sales/invoice/{invoice_id}/cancel
Content-Type: application/json
```

| Campo | Tipo | Obligatorio | Validación |
|---|---|---|---|
| `cancelReason` | string | **Sí** | no vacío, máx. 1000 caracteres |

```json
{ "cancelReason": "Duplicated invoice, replaced by INV-001042" }
```

**Lógica del servidor**

- Desde `DRAFT` o `ISSUED`; en ambos casos se valida que no existan pagos vigentes.
- `status = CANCELLED`, `cancelledAt = now`, `cancelReason` persistido, `isOverdue = false`,
  `overdueNotifiedAt = null`.
- **Libera el lock** de la factura: es un estado final y no debe seguir ocupando un tab.
- La factura **nunca** se borra físicamente; queda para auditoría.

**Response 200 OK** — `MessageResponse<InvoiceResponse>` con `status: "CANCELLED"`.

### 15.4 Eliminar factura — `DELETE /sales/invoice/{invoice_id}`

```
DELETE /sales/invoice/{invoice_id}
```

Sin body. Solo para un **draft nuevo**: `status = DRAFT` **y** `number = null`.

**Lógica del servidor**

- Borra el historial y la fila de clonación de esa factura, luego la factura (productos, charges,
  taxes, pagos y POs vinculadas se van en cascada).
- Devuelve el `draftNumber` a la lista de números libres, de modo que la siguiente factura creada
  lo reutiliza.

**Response 200 OK**

```json
{
  "title": "Success",
  "message": "The Invoice has been successfully deleted",
  "data": "3f2a1b8c-..."
}
```

### Errores posibles (§15)

| Código | Mensaje | Causa |
|---|---|---|
| 400 | `sales.invoice.invalid-transition` | Transición no permitida; el texto incluye estado origen y destino |
| 400 | `sales.invoice.has-payments` | Revert o cancel sobre una factura con pagos vigentes |
| 400 | `sales.invoice.issue-no-products` | Emitir sin productos |
| 400 | `sales.invoice.issue-zero-total` | Emitir con total ≤ 0 |
| 400 | `sales.invoice.client-incomplete` | El Cliente perdió datos obligatorios (dirección, ciudad, contacto, teléfono) |
| 400 | `sales.invoice.not-deletable` | Eliminar una factura que no es draft, o un draft que ya tuvo `number` |
| 400 | `sales.invoice.not-block` / `not-block-by` | La factura no está abierta por el usuario |
| 400 | `cancelReason - Cancel reason is required` | Cancelar sin motivo (`formErrors.cancelReason`) |
| 403 | `sales.invoice.access-denied` | El usuario no es el `salesRep` (VIEW_ALL no otorga escritura) |
| 404 | `sales.invoice.not-exist` | Factura inexistente |

---

## 16. Pagos de la factura

Base: `/sales/invoice/{invoice_id}/payment`. Los pagos son **inmutables**: no se editan ni se
borran; un error se corrige anulando el pago y registrando uno nuevo.

Al registrar o anular, el servidor recalcula en la misma transacción:

- `paidAmount` = suma de pagos **no anulados**.
- `balanceDue` = `totalAmount - paidAmount`.
- `status`: `paidAmount = 0` → `ISSUED`; `0 < paidAmount < totalAmount` → `PARTIAL_PAID`
  (`partialPaidAt` se fija solo la primera vez); `paidAmount ≥ totalAmount` → `PAID`
  (`paidAt = now`, `isOverdue = false`, `overdueNotifiedAt = null`).

### 16.1 Registrar pago — `POST /sales/invoice/{invoice_id}/payment`

```
POST /sales/invoice/{invoice_id}/payment
Content-Type: multipart/form-data
```

Dos partes:

| Parte | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `payment` | `application/json` | **Sí** | Cuerpo del pago (tabla abajo) |
| `receipt` | archivo | **Sí** | Comprobante: `pdf`, `jpg`, `jpeg` o `png` |

Campos de la parte `payment`:

| Campo | Tipo | Obligatorio | Validación |
|---|---|---|---|
| `amount` | number | **Sí** | `> 0` y `≤ balanceDue` (no se permite sobre-pago) |
| `paymentDate` | string (`YYYY-MM-DD`) | **Sí** | — |
| `paymentMethod` | enum | **Sí** | `ACH`, `CREDIT_CARD`, `WIRE_TRANSFER`, `CHECK` |
| `notes` | string | No | máx. 1000 caracteres |

```json
{
  "amount": 5000.00,
  "paymentDate": "2026-08-10",
  "paymentMethod": "WIRE_TRANSFER",
  "notes": "Ref. 998877"
}
```

Solo se acepta si `status` es `ISSUED` o `PARTIAL_PAID`, el usuario es el `salesRep` y tiene la
factura abierta con lock.

**Response 201 Created** — `MessageResponse<InvoicePaymentResponse>`:

```json
{
  "title": "Success",
  "message": "The payment has been successfully registered",
  "data": {
    "id": "9a1c...",
    "amount": 5000.00000,
    "paymentDate": "2026-08-10",
    "paymentMethod": "WIRE_TRANSFER",
    "receiptOriginalName": "comprobante-agosto.pdf",
    "notes": "Ref. 998877",
    "voided": false,
    "voidedReason": null,
    "voidedAt": null,
    "voidedBy": null,
    "registeredBy": { "id": "...", "fullName": "Ana Pérez", "departments": [], "role": null, "active": true },
    "createdAt": "2026-08-10T14:22:07-04:00"
  }
}
```

> El comprobante se almacena en el servidor bajo
> `{data}/{año}/{mes}/{departamento}/INV/payments/{número}-{uuid}.{ext}` (mismo layout que los PDF
> de QR/Q/PO). La ruta física **no** se expone en la respuesta; solo el nombre original del archivo.

### 16.2 Anular pago — `PATCH /sales/invoice/{invoice_id}/payment/{payment_id}/void`

```
PATCH /sales/invoice/{invoice_id}/payment/{payment_id}/void
Content-Type: application/json
```

| Campo | Tipo | Obligatorio | Validación |
|---|---|---|---|
| `voidedReason` | string | **Sí** | no vacío, máx. 1000 caracteres |

```json
{ "voidedReason": "Wrong amount, re-registered as payment #2" }
```

Marca `voided = true`, `voidedAt`, `voidedBy`, y recalcula saldo y estado (`PAID → PARTIAL_PAID`, o
`PARTIAL_PAID → ISSUED` si ya no queda ningún pago vigente). El archivo del comprobante **no** se
borra, queda para auditoría.

**Response 200 OK** — `MessageResponse<InvoicePaymentResponse>` con `voided: true`.

### 16.3 Listar pagos — `GET /sales/invoice/{invoice_id}/payment`

Devuelve todos los pagos de la factura, anulados incluidos, ordenados por fecha de creación.

**Response 200 OK** — `List<InvoicePaymentResponse>` (array plano, sin `MessageResponse`).

### Errores posibles (§16)

| Código | Mensaje | Causa |
|---|---|---|
| 400 | `sales.invoice.payment.not-payable` | La factura no está en `ISSUED` ni `PARTIAL_PAID` |
| 400 | `sales.invoice.payment.invalid-amount` | El monto supera el saldo pendiente |
| 400 | `sales.invoice.payment.receipt-required` | Falta el comprobante |
| 400 | `file.type.error` | Extensión de comprobante no permitida |
| 400 | `sales.invoice.payment.not-exist` | El pago no pertenece a esa factura |
| 400 | `sales.invoice.payment.already-voided` | El pago ya estaba anulado |
| 400 | `sales.invoice.not-block` / `not-block-by` | La factura no está abierta por el usuario |
| 400 | `amount - The amount must be greater than zero` | Validación de campo (`formErrors`) |
| 403 | `sales.invoice.access-denied` | El usuario no es el `salesRep` |
| 404 | `sales.invoice.not-exist` | Factura inexistente |

---

## 17. Cambios sobre contratos existentes

- **`InvoiceProductResponse` — cambio breaking**: el campo **`extendedPrice`** ahora devuelve el
  costo puro de la línea (`quantity × unitPrice`), sin aplicar el margen de ganancia. Antes
  devolvía el precio de venta (`quantity × unitPrice × (1 + profitMargin / 100)`). Se agregan
  dos campos nuevos:
  - **`sellingUnitPrice`**: precio de venta unitario (`unitPrice × (1 + profitMargin / 100)`).
  - **`sellingExtendedPrice`**: precio de venta total de la línea (`quantity × sellingUnitPrice`).
    Es el valor que antes tenía `extendedPrice`.
  - **`productsTotal`** ahora se calcula como la suma de `sellingExtendedPrice` (antes era la suma
    de `extendedPrice`). El `totalAmount` de la factura no se ve afectado porque ya usaba la
    fórmula correcta a nivel de entidad.
- **`payment_terms` (dropdown en `/common/static_lists`)**: el contrato del endpoint **no cambia**
  (sigue siendo `{key, value}`), pero cada término pasó a llevar internamente su regla de
  vencimiento. El frontend puede seguir usando la lista tal cual; solo debe tener presente que los
  términos `ADVANCED`, `PRIOR_TO_SHIPMENT`, `W_DOCUMENTS` y `TO_BE_AGREED` dejan `dueAt` en `null`.
- **`InvoiceResponse`**: los campos que hasta ahora siempre llegaban en `null`/`0` ya se llenan a lo
  largo del ciclo de vida — `number`, `issuedAt`, `dueAt`, `paidAmount`, `balanceDue`,
  `partialPaidAt`, `paidAt`, `cancelledAt`, `cancelReason`, `isOverdue`. No se agregaron ni
  removieron campos.
- **`open-lock`**: una factura en `PAID` ahora **sí** admite lock de edición, porque anular un pago
  es la vía de corrección de una factura pagada. `CANCELLED` sigue sin ser bloqueable.
- **Historial**: el diff de las acciones `ISSUE`, `CANCEL` y `REVERT_TO_DRAFT` ahora también incluye
  `number`, `totalAmount`, `paidAmount`, `partialPaidAt` y `paidAt`. Se agregan las acciones
  `REGISTER_PAYMENT` y `VOID_PAYMENT` al historial de la factura.
- **`POST`/`PUT /sales/invoice/{id}/tax` — cambio breaking**: el campo **`value` se eliminó del
  request**. El frontend envía `rate` y `taxableBase`; el backend calcula
  `value = taxableBase * rate` con `BigDecimal` (escala 5, HALF_UP) y lo persiste. Enviar `value`
  ya no tiene efecto. En la respuesta el campo sigue existiendo, con el valor calculado.
  > Excepción: los impuestos importados desde un PO (`charge/import-from-po`) traen `rate = 0`,
  > `taxableBase = 0` y el monto del `salesTax` del PO tal cual, porque ese dato llega sin tasa ni
  > base. Si se edita esa fila por el endpoint de taxes, el valor pasa a recalcularse.
- **`InvoiceResponse` y `ListInvoiceResponse`** ganan **`paidLate`** (boolean): la factura se pagó
  después de su `dueAt`. Es un derivado de `paidAt > dueAt`, y sirve para no perder el dato cuando
  `isOverdue` se apaga al recibirse el pago.
- **`pdfUrl` solo se llena en facturas emitidas.** En `DRAFT` siempre llega `null` aunque el
  `print` funcione: el PDF de borrador se genera al vuelo y no se guarda. `pdfUrl != null` equivale
  entonces a "hay un documento oficial".
- **`POST /sales/invoice/{id}/payment`**: el `amount` acepta como máximo **5 decimales**
  (`@Digits`); antes un valor con más decimales se aceptaba y la base de datos lo redondeaba en
  silencio. Además, el registro y la anulación bloquean la fila de la factura mientras validan y
  recalculan, así que dos peticiones simultáneas ya no pueden dejarla sobre-pagada — la segunda
  espera y luego falla con `sales.invoice.payment.invalid-amount`.

### Cambios de la auditoría del módulo

- **`PUT /sales/invoice/{id}` ahora acepta facturas `ISSUED`** en modo restringido (§10): solo
  `internalRemarks`, `remarks`, `orderNumber`, `awbBl` y `packingList`. Antes devolvía
  `not-editable` para todo lo que no fuera `DRAFT`, contra lo que dice la guía §4. Nuevo error
  `sales.invoice.issued-restricted-field`.
- **`GET /sales/invoice/{id}/history` aplica alcance por vendedor** (§7). Antes cualquiera con
  `VIEW_HISTORY_INVOICE` leía el historial de facturas ajenas. También pasa de lista vacía a `404`
  cuando la factura no existe. El path variable se normalizó a `{invoice_id}` (antes `{invoiceId}`);
  la ruta efectiva no cambia.
- **`PATCH /sales/invoice/close/{id}` valida el dueño del lock** (§5): cerrar una factura abierta
  por otro usuario devuelve `sales.invoice.not-block-by`.
- **`GET /sales/invoice/statement/{client_id}` excluye los borradores** (§18.2): antes sumaban en
  `totalInvoiced` y aparecían en el bucket `current` del aging.
- **`DELETE /sales/invoice/{id}/purchase-order/{po_id}`**: el path variable pasó de `ip_po_id` a
  `po_id` — el valor siempre fue el id del PO, no el de la fila de enlace. La ruta efectiva no
  cambia.

---

## 18. Documento PDF y estado de cuenta

### 18.1 Imprimir factura — `GET /sales/invoice/print/{invoice_id}`

```
GET /sales/invoice/print/{invoice_id}
```

Permiso: `VIEW_INVOICE`. **No** exige ser el `salesRep` ni tener la factura abierta con lock —
imprimir es una lectura.

**Dos comportamientos según el estado**

| Estado | Qué hace |
|---|---|
| `DRAFT` | Regenera el PDF en cada llamada, con los datos actuales, y lo marca como borrador. **No** persiste `pdfUrl`. |
| Cualquier otro | Si ya existe el documento oficial lo devuelve tal cual, sin regenerar. Si no existe (por ejemplo porque falló al emitir), lo genera y lo persiste en `pdfUrl`. |

El nombre del archivo en disco es el número oficial con ceros a la izquierda (`001000.pdf`), o el
`draftNumber` mientras la factura sea borrador, bajo
`{data}/{año}/{mes}/{departamento}/INV/`. El idioma de la plantilla sale del `language` del Cliente.

**Response 200 OK** — `application/pdf`, `Content-Disposition: inline; filename="invoice_<id>.pdf"`.
El cuerpo son los bytes del PDF, no un JSON.

| Código | Mensaje | Causa |
|---|---|---|
| 400 | `sales.invoice.not-generate-doc` | La factura no tiene productos |
| 403 | `sales.invoice.access-denied` | Alcance por vendedor |
| 404 | `sales.invoice.not-exist` | Factura inexistente |
| 404 | error de generación | La plantilla Jasper no está disponible o falló el render |

> **Print & Send.** No hay endpoint propio de envío, igual que en QR, Q y PO: el frontend descarga
> el PDF de este endpoint y lo reenvía por `POST /email/send-attachment` (multipart, parte
> `request` con el `EmailRequest` y parte `files` con el archivo). La única regla adicional del
> módulo de facturas es que **el botón de enviar solo se habilita con la factura ya emitida**; en
> `DRAFT` se puede imprimir pero no enviar. Esa validación es del frontend — el endpoint de correo
> es genérico y no conoce el módulo.

### 18.2 Estado de cuenta del cliente — `GET /sales/invoice/statement/{client_id}`

```
GET /sales/invoice/statement/{client_id}
```

Permiso: `VIEW_INVOICE`. Aplica el mismo alcance por vendedor que el listado: sin
`VIEW_ALL_INVOICE`, las cifras solo cubren las facturas propias.

**Solo cuenta lo efectivamente facturado**: `ISSUED`, `PARTIAL_PAID` y `PAID`. Los **borradores** y
las **canceladas** quedan fuera de `invoiceCount`, de los totales y del aging — un draft nunca se
facturó y una cancelada no representa nada adeudado.

**Response 200 OK** — objeto plano (sin `MessageResponse`):

```json
{
  "clientId": "8c1d...",
  "clientName": "ACME Industrial S.A.S.",
  "invoiceCount": 14,
  "totalInvoiced": 184500.00000,
  "totalPaid": 121000.00000,
  "totalOutstanding": 63500.00000,
  "aging": {
    "current": 20000.00000,
    "days1To30": 18500.00000,
    "days31To60": 15000.00000,
    "days61To90": 6000.00000,
    "days90Plus": 4000.00000
  },
  "overdueInvoices": [
    {
      "id": "3f2a...",
      "number": "001000",
      "status": "PARTIAL_PAID",
      "totalAmount": 15400.00000,
      "paidAmount": 5000.00000,
      "balanceDue": 10400.00000,
      "dueAt": "2026-06-09T14:05:31-04:00",
      "overdue": true,
      "paidLate": false
    }
  ]
}
```

- `aging` reparte el **saldo pendiente** según los días transcurridos desde `dueAt`. `current` es lo
  que aún no vence, e incluye las facturas cuyos términos de pago no permiten calcular vencimiento
  (`dueAt = null`).
- `overdueInvoices` son las filas del listado (`ListInvoiceResponse`) con `overdue = true`.

| Código | Mensaje | Causa |
|---|---|---|
| 404 | `partner.client.not-exist` | Cliente inexistente |

---

## Formato de respuesta de error

Todas las respuestas de error siguen el mismo schema:

```json
{
  "errorMessage": "sales.invoice.not-exist",
  "statusCode": 404,
  "formErrors": null
}
```

Para errores de validación (`422`/`400` por `@Valid`):

```json
{
  "errorMessage": "<field> - mensaje de error",
  "statusCode": 400,
  "formErrors": {
    "fieldName": "mensaje de error específico"
  }
}
```

---

## Resumen de permisos por endpoint

| Endpoint | Anotación | Acción/Permiso |
|---|---|---|
| `POST /sales/invoice` | `@AccessToAction(CREATE_INVOICE)` | `CREATE_INVOICE (5001001)` |
| `PUT /sales/invoice/{id}` | `@AccessToAction(UPDATE_INVOICE)` | `UPDATE_INVOICE (5001002)` + condicionales `EDIT_PAYMENT_TERMS_INVOICE (5001006)`, `CHANGE_SALES_REP_INVOICE (5001014)` |
| `GET /sales/invoice` | `@AccessToAction(VIEW_INVOICE)` | `VIEW_INVOICE (5001007)` |
| `GET /sales/invoice/load-open` | `@AccessToModule(INVOICES)` | Módulo `INVOICES` |
| `PATCH /sales/invoice/close-list` | `@AccessToModule(INVOICES)` | Módulo `INVOICES` |
| `PATCH /sales/invoice/open-lock/{id}` | `@AccessToModule(INVOICES)` | Módulo `INVOICES` |
| `PATCH /sales/invoice/close/{id}` | `@AccessToModule(INVOICES)` | Módulo `INVOICES` |
| `PATCH /sales/invoice/clone/{id}` | `@AccessToAction(CLONE_INVOICE)` | `CLONE_INVOICE (5001004)` |
| `GET /sales/invoice/{id}/history` | `@AccessToAction(VIEW_HISTORY_INVOICE)` | `VIEW_HISTORY_INVOICE (5001003)` |
| `POST/PUT/DELETE /sales/invoice/{id}/product[/**]` | `@AccessToAction(UPDATE_INVOICE)` | `UPDATE_INVOICE (5001002)` |
| `GET /sales/invoice/{id}/product/{pid}` | `@AccessToAction(VIEW_INVOICE)` | `VIEW_INVOICE (5001007)` |
| `GET /sales/invoice/{id}/product/available-from-pos` | `@AccessToAction(VIEW_INVOICE)` | `VIEW_INVOICE (5001007)` |
| `POST/PUT/DELETE /sales/invoice/{id}/charge[/**]` | `@AccessToAction(UPDATE_INVOICE)` | `UPDATE_INVOICE (5001002)` |
| `GET /sales/invoice/{id}/charge/{cid}` | `@AccessToAction(VIEW_INVOICE)` | `VIEW_INVOICE (5001007)` |
| `GET /sales/invoice/{id}/charge/available-from-pos` | `@AccessToAction(VIEW_INVOICE)` | `VIEW_INVOICE (5001007)` |
| `POST/PUT/DELETE /sales/invoice/{id}/tax[/**]` | `@AccessToAction(UPDATE_INVOICE)` | `UPDATE_INVOICE (5001002)` |
| `GET /sales/invoice/{id}/tax/{tid}` | `@AccessToAction(VIEW_INVOICE)` | `VIEW_INVOICE (5001007)` |
| `POST/DELETE /sales/invoice/{id}/purchase-order[/**]` | `@AccessToAction(UPDATE_INVOICE)` | `UPDATE_INVOICE (5001002)` |
| `PATCH /sales/invoice/{id}/issue` | `@AccessToAction(ISSUE_INVOICE)` | `ISSUE_INVOICE (5001008)` |
| `PATCH /sales/invoice/{id}/revert-to-draft` | `@AccessToAction(REVERT_INVOICE_TO_DRAFT)` | `REVERT_INVOICE_TO_DRAFT (5001011)` |
| `PATCH /sales/invoice/{id}/cancel` | `@AccessToAction(CANCEL_INVOICE)` | `CANCEL_INVOICE (5001005)` |
| `DELETE /sales/invoice/{id}` | `@AccessToAction(DELETE_INVOICE)` | `DELETE_INVOICE (5001010)` |
| `POST /sales/invoice/{id}/payment` | `@AccessToAction(REGISTER_PAYMENT_INVOICE)` | `REGISTER_PAYMENT_INVOICE (5001009)` |
| `PATCH /sales/invoice/{id}/payment/{pid}/void` | `@AccessToAction(VOID_PAYMENT_INVOICE)` | `VOID_PAYMENT_INVOICE (5001012)` |
| `GET /sales/invoice/{id}/payment` | `@AccessToAction(VIEW_INVOICE)` | `VIEW_INVOICE (5001007)` |
| `GET /sales/invoice/print/{id}` | `@AccessToAction(VIEW_INVOICE)` | `VIEW_INVOICE (5001007)` |
| `GET /sales/invoice/statement/{client_id}` | `@AccessToAction(VIEW_INVOICE)` | `VIEW_INVOICE (5001007)` |
| `GET /common/static_lists` | Sin anotación (público con JWT) | Solo autenticación |

> **Alcance por vendedor:** Los endpoints que acceden a una factura específica (`open-lock`, `clone`) también validan que el usuario tenga `VIEW_ALL_INVOICE (5001013)` o sea el `salesRep` de la factura. Los endpoints de listado (`GET`) aplican el mismo filtro a nivel de query.
>
> **Escritura:** todas las transiciones de estado, el borrado y los pagos exigen además ser el
> `salesRep` de la factura (`VIEW_ALL_INVOICE` da visibilidad, no escritura) y tenerla abierta con
> lock de edición.

---

## Schemas anidados en InvoiceResponse

Cuando se devuelve el detalle completo de una factura (abrir, crear, actualizar), se incluyen:

### InvoiceClientResponse

Bill-to liviano sin colecciones (evita N+1 sobre `client.infoByDepartment → listContacts`):

```json
{
  "id": "uuid",
  "code": "CLT-001",
  "name": "Cliente S.A.",
  "showName": "(CLT-001) Cliente S.A.",
  "taxId": "123456789",
  "address": "Calle Principal 123",
  "city": { "id": "uuid", "name": "Miami" },
  "zipCode": "33101",
  "phoneNumber": "+1234567890",
  "paymentTerms": "NET_30"
}
```

### InvoiceProductResponse

Línea de producto con su correspondencia en la factura:

```json
{
  "id": "uuid",
  "ipProduct": {
    "id": "uuid",
    "name": "Producto A",
    "description": "Descripción",
    "clientDescription": "Cómo lo llama el cliente",
    "mfrReference": "MFR-123",
    "clientReference": "CLT-REF-123",
    "brand": { "id": "uuid", "name": "Marca X" },
    "coo": { "id": "uuid", "name": "United States" }
  },
  "number": 1,
  "quantity": 100.00000,
  "unitType": "UNITS",
  "leadTime": 15,
  "leadTimeType": "DAYS",
  "unitPrice": 50.00000,
  "profitMargin": 0.25,
  "condition": "NEW",
  "extendedPrice": 5000.00000,
  "sellingUnitPrice": 62.50000,
  "sellingExtendedPrice": 6250.00000
}
```

> **Precisión:** escala interna 5 decimales, redondeo HALF_UP. Display en PDF: 2 decimales.
>
> **Campos de precio:**
> - `unitPrice`: costo unitario del producto (sin margen).
> - `extendedPrice`: costo total de la línea (`quantity × unitPrice`), sin margen. Solo display.
> - `sellingUnitPrice`: precio de venta unitario (`unitPrice × (1 + profitMargin / 100)`).
> - `sellingExtendedPrice`: precio de venta total de la línea (`quantity × sellingUnitPrice`). Usado para `productsTotal` y `totalAmount`.

### InvoiceChargeResponse

```json
{
  "id": "uuid",
  "description": "Flete internacional",
  "type": "INTERNATIONAL_FREIGHT",
  "value": 500.00000
}
```

### InvoiceTaxResponse

```json
{
  "id": "uuid",
  "type": "US_SALES_TAX",
  "description": "Impuesto de ventas USA",
  "rate": 0.0875,
  "taxableBase": 5500.00000,
  "value": 481.25000
}
```

### Linked Purchase Order

Reusa `BasicIpPurchaseOrderResponse`:

```json
{
  "id": "uuid",
  "number": "000123"
}
```

### Totales desglosados

En `InvoiceResponse`:
- **`productsTotal`**: ∑ `sellingExtendedPrice` de todas las líneas (precio de venta con margen), escala 5.
- **`chargesTotal`**: ∑ `charges[].value`, escala 5.
- **`taxesTotal`**: ∑ `taxes[].value`, escala 5.
- **`totalAmount`**: `productsTotal + chargesTotal + taxesTotal` — **no se recalcula en PUT**, solo en POST o cuando se modifican productos/cargos/impuestos.
- **`balanceDue`**: `totalAmount - paidAmount`.

> **Lista vs Detalle:** Los endpoints de listado (`GET /sales/invoice`) devuelven `ListInvoiceResponse` (sin `products`, `charges`, `taxes`, `linkedPurchaseOrders` — solo montos agregados). El detalle (`open-lock`, `POST`, `PUT`) devuelve `InvoiceResponse` (con las listas completas y los tres totales desglosados).

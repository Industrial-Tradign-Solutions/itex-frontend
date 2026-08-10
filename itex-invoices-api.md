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
        "profitMargin": 25.00,
        "condition": "NEW",
        "extendedPrice": 5000.00000
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
GET /sales/invoice/{invoiceId}/history
```

### Entrada

**Path params:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `invoiceId` | `UUID` | ID de la factura |

Sin query params.

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

### Permisos

- `VIEW_HISTORY_INVOICE (5001003)` — **obligatorio**

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

Edita una factura en estado `DRAFT`. Solo aplica a drafts; nunca toca numeración, status, departamento, montos ni timestamps de ciclo de vida.

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
3. **Guard de estado editable**: solo `DRAFT` → `400` (`sales.invoice.not-editable`). `ISSUED`/`PARTIAL_PAID` solo aceptan pagos; `PAID`/`CANCELLED` son finales.
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
| `400` | Factura no está en `DRAFT` | `ErrorResponse` — `"sales.invoice.not-editable"` |
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

> **Precio.** `unitPrice` es el **costo** y `profitMargin` el **margen tal cual** (no fracción, ej.
> `30.00` = 30%, `0.40` = 0.40%; mínimo `0.01`, máximo `100`). El backend lo divide entre 100 para
> aplicarlo: `quantity × unitPrice × (1 + profitMargin / 100)` — el margen se aplica **una sola
> vez**. El `extendedPrice` de la respuesta ya lo trae aplicado.

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
  "profitMargin": 30.00,
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
    "profitMargin": 30.00,
    "condition": "NEW",
    "extendedPrice": 6500.00000
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
    "profitMargin": 30.00000,
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
  "taxableBase": 5500.00000,
  "value": 481.25000
}
```

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

### 14.2 Desvincular PO — `DELETE /sales/invoice/{invoice_id}/purchase-order/{ip_po_id}`

`{ip_po_id}` es el id del PO. Response `200 OK`:

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
| `GET /common/static_lists` | Sin anotación (público con JWT) | Solo autenticación |

> **Alcance por vendedor:** Los endpoints que acceden a una factura específica (`open-lock`, `clone`) también validan que el usuario tenga `VIEW_ALL_INVOICE (5001013)` o sea el `salesRep` de la factura. Los endpoints de listado (`GET`) aplican el mismo filtro a nivel de query.

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
  "profitMargin": 25.00,
  "condition": "NEW",
  "extendedPrice": 5000.00000
}
```

> **Precisión:** escala interna 5 decimales, redondeo HALF_UP. Display en PDF: 2 decimales.

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
- **`productsTotal`**: ∑ `quantity × unitPrice` de todas las líneas, escala 5.
- **`chargesTotal`**: ∑ `charges[].value`, escala 5.
- **`taxesTotal`**: ∑ `taxes[].value`, escala 5.
- **`totalAmount`**: `productsTotal + chargesTotal + taxesTotal` — **no se recalcula en PUT**, solo en POST o cuando se modifican productos/cargos/impuestos.
- **`balanceDue`**: `totalAmount - paidAmount`.

> **Lista vs Detalle:** Los endpoints de listado (`GET /sales/invoice`) devuelven `ListInvoiceResponse` (sin `products`, `charges`, `taxes`, `linkedPurchaseOrders` — solo montos agregados). El detalle (`open-lock`, `POST`, `PUT`) devuelve `InvoiceResponse` (con las listas completas y los tres totales desglosados).

# IP Quotation — Product Bulk Add Endpoint

`POST /itex/api/ip/q/{id_quotation}/product`

## Descripción

Agrega uno o varios productos a una cotización (Quotation) existente.  
El endpoint es **idempotente**: si un producto ya existe en la cotización, se ignora silenciosamente sin error.

## Request Body

```json
{
  "products": [
    {
      "quotationsQuoteRequestId": "uuid",
      "quoteRequestProductId": "uuid",
      "profitMargin": 0.15,
      "condition": "NEW"
    }
  ]
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `products` | `array` | Sí (mín 1) | Lista de productos a agregar |
| `products[].quotationsQuoteRequestId` | `UUID` | Sí | Referencia al `IpQuotationsQuoteRequest` asociado a esta cotización |
| `products[].quoteRequestProductId` | `UUID` | Sí | Referencia al `IpQuoteRequestProduct` a agregar |
| `products[].profitMargin` | `BigDecimal` (3,2) | Sí | Margen de ganancia (0.00 – 1.00) |
| `products[].condition` | `String` | Sí | Condición del producto (ej. `NEW`, `USED`) |

## Response (201 Created)

```json
{
  "title": "Success",
  "message": "Products have been successfully added to the Quotation",
  "data": [
    {
      "id": "uuid",
      "quotationsQuoteRequestId": "uuid",
      "quoteRequestProduct": { ... },
      "number": 1,
      "profitMargin": 0.15,
      "condition": "NEW",
      "sellingUnitPrice": 115.00000,
      "sellingExtendedPrice": 575.00,
      "grossWeightLbs": 50.00,
      "qrNumber": "QR-00001",
      "supplierName": "Supplier Corp"
    }
  ]
}
```

El campo `data` contiene **solo los productos que fueron creados** (los ignorados no se incluyen).

## Reglas de Negocio

### 1. Validaciones del request (Spring `@Valid`)

- Lista no puede estar vacía
- Todos los campos de cada producto son obligatorios
- `profitMargin` debe estar entre 0.00 y 1.00 (validado por la entidad)

### 2. Deduplicación en memoria (dentro del mismo request)

| Escenario | Comportamiento |
|---|---|
| Mismo `quoteRequestProductId` aparece dos veces | **Error HTTP 400** — el request es inválido |
| Mismo `productId` (producto físico) aparece dos veces | Se **ignora el segundo** (first-wins, silencioso) |

### 3. Validación contra base de datos

| Escenario | Comportamiento |
|---|---|
| `(quotationId, quoteRequestProductId)` ya existe | Se **ignora silenciosamente** (idempotente) |
| `productId` ya existe en la cotización (por otro `quoteRequestProductId`) | **Error HTTP 400** con rollback total |
| `quotationsQuoteRequestId` no pertenece a la cotización | **Error HTTP 404** |

### 4. Transaccionalidad

El batch completo es **todo o nada**. Si cualquier producto falla (productId duplicado, referencia inválida, etc.), se revierte toda la operación.

## Flujo Interno

```
POST /ip/q/{id_quotation}/product
    │
    ├─ [Controller] @Valid IpQuotationProductBulkRequest
    │     │
    │     └─ buildDTO() cada request → List<IpQuotationProductDTO>
    │
    ├─ [Service] createIpQuotationProducts()
    │     │
    │     ├─ 1. Validar quoteRequestProductId únicos en request
    │     ├─ 2. Cargar mapeo quoteRequestProductId → productId
    │     ├─ 3. Deduplicar por productId (first-wins)
    │     ├─ 4. Cargar estado existente de la BD (2 queries)
    │     ├─ 5. Por cada producto:
    │     │     ├─ ¿quoteRequestProductId ya existe? → skip
    │     │     ├─ ¿productId ya ocupado? → ❌ error
    │     │     └─ Build entity + calcular number secuencial
    │     └─ 6. saveAll() transaccional
    │
    ├─ [History] addHistoryProduct() por cada creado
    │
    └─ 201 Created + List<IpQuotationProductResponse>
```

## Casos de Uso

### Caso 1: Agregar 3 productos nuevos

**Request**
```json
{
  "products": [
    { "quotationsQuoteRequestId": "A", "quoteRequestProductId": "P1", "profitMargin": 0.10, "condition": "NEW" },
    { "quotationsQuoteRequestId": "A", "quoteRequestProductId": "P2", "profitMargin": 0.15, "condition": "NEW" },
    { "quotationsQuoteRequestId": "B", "quoteRequestProductId": "P3", "profitMargin": 0.20, "condition": "USED" }
  ]
}
```

**Resultado**: 3 productos creados. `data` contiene 3 elementos.

---

### Caso 2: Mezcla de nuevos + ya existentes

**Request**: 2 productos, donde P1 ya existe en la cotización.

```json
{
  "products": [
    { "quotationsQuoteRequestId": "A", "quoteRequestProductId": "P1", "profitMargin": 0.10, "condition": "NEW" },
    { "quotationsQuoteRequestId": "A", "quoteRequestProductId": "P4", "profitMargin": 0.15, "condition": "NEW" }
  ]
}
```

**Resultado**: P1 se ignora, solo P4 se crea. `data` contiene 1 elemento.

---

### Caso 3: Mismo producto físico en dos líneas del request

**Request**: P1 y P5 apuntan al mismo `productId` físico.

```json
{
  "products": [
    { "quotationsQuoteRequestId": "A", "quoteRequestProductId": "P1", "profitMargin": 0.10, "condition": "NEW" },
    { "quotationsQuoteRequestId": "A", "quoteRequestProductId": "P5", "profitMargin": 0.15, "condition": "NEW" }
  ]
}
```

**Resultado**: Solo P1 se procesa. P5 se ignora silenciosamente (mismo producto físico).

---

### Caso 4: quoteRequestProductId duplicado en request

**Request**: P1 aparece dos veces.

```json
{
  "products": [
    { "quotationsQuoteRequestId": "A", "quoteRequestProductId": "P1", "profitMargin": 0.10, "condition": "NEW" },
    { "quotationsQuoteRequestId": "B", "quoteRequestProductId": "P1", "profitMargin": 0.15, "condition": "NEW" }
  ]
}
```

**Resultado**: Error HTTP 400 — `quoteRequestProductId` repetido.

---

### Caso 5: productId ya existe en la cotización

P1 (productId=X) ya está en la cotización. Llega P6 (productId=X también, diferente `quoteRequestProductId`).

```json
{
  "products": [
    { "quotationsQuoteRequestId": "A", "quoteRequestProductId": "P6", "profitMargin": 0.10, "condition": "NEW" }
  ]
}
```

**Resultado**: Error HTTP 400 — rollback total. Nada se crea.

---

### Caso 6: Lista vacía

```json
{ "products": [] }
```

**Resultado**: Error HTTP 400 — `@NotEmpty`.

## Códigos de Error

| HTTP | Causa |
|---|---|
| 400 | Lista vacía, campos faltantes, `profitMargin` fuera de rango, `quoteRequestProductId` duplicado en request, `productId` ya en cotización |
| 404 | `quotationsQuoteRequestId` no existe para esta cotización, `quoteRequestProductId` no existe |

## Consideraciones Técnicas

- Usa **Java 21 text blocks** para las JPQL queries (multilínea legible)
- La numeración secuencial (`number`) se calcula por cada `quotationsQuoteRequestId` dentro del batch
- El método `createIpQuotationProduct` (single) fue eliminado en favor del bulk
- No requiere cambios en migraciones Flyway — el unique constraint existente `(quote_request_product_id, quotations_quote_request_id)` protege a nivel BD

# Ajustes API: Cloned Invoices y Parent Invoice

## Estado: Implementado y documentado

Los campos `clonedInvoices`, `clonedByInvoice` y `paidLate` estan documentados
en la API (`itex-invoices-api.md`) y consumidos por el frontend.

## Campos confirmados en `InvoiceResponse` (endpoint `open-lock`)

### `clonedInvoices` — §4 línea 299, §17

```json
{
  "clonedInvoices": [
    { "id": "uuid", "number": "INV-001234" }
  ]
}
```

- Schema: `InvoiceBasicResponse` (§19) — solo `id` + `number`
- `number` contiene el `draftNumber` formateado si esta en DRAFT, o el `number` formateado si fue emitida
- Array vacio si no hay clones
- Solo aparece en endpoints de detalle (`open-lock`, `POST`, `PUT`), no en el listado

### `clonedByInvoice` — §4 línea 300, §17

```json
{
  "clonedByInvoice": { "id": "uuid", "number": "INV-001000" }
}
```

- `null` si no fue clonada
- Mismo schema `InvoiceBasicResponse`

### `paidLate` — §17 línea 1608

```json
{ "paidLate": true }
```

- Boolean: la factura se pago despues de su `dueAt`
- Derivado de `paidAt > dueAt`
- Sobrevive el pago (a diferencia de `overdue`)

### `createdAt`

- Presente en endpoints de listado (§1, §2)
- El frontend lo renderiza como chip en el footer
- **§4 no lo lista explicitamente** en el sample de respuesta, pero el tipo lo declara como `string` requerido

## Frontend: tipos limpiados

- `clonedInvoices`: `{ id: string; number: string }[]` (requerido, no opcional)
- `clonedByInvoice`: `{ id: string; number: string } | null` (requerido, nullable)
- `paidLate`: `boolean` (requerido, no opcional)
- `createdAt`: `string` (requerido)
- Eliminado `draftNumber` de los objetos clone (no existe en `InvoiceBasicResponse`)
- Simplificado `cloned.number ?? cloned.draftNumber` a `cloned.number` en el template

# Cambios Frontend — Módulos Q (Quotations) y QR (Quote Requests)

> **Fecha:** 2026-09-08  
> **Módulos afectados:** `IP_QUOTATIONS`, `IP_QUOTE_REQUESTS`  
> **Backend base:** `src/main/java/com/itradingsolutions/itex/api/ip/q` y `src/main/java/com/itradingsolutions/itex/api/ip/qr`

---

## 1. Resumen de cambios

Se implementaron nuevas reglas de negocio en los módulos **Q** y **QR** para alinear controles, auditoría y validaciones. Los cambios más relevantes para frontend son:

1. Nuevo permiso para completar una Q manualmente.
2. Gate de permiso en la edición de `paymentTerms` de una Q.
3. Auto-rechazo de Qs en 30 días (con historial) y ajuste de horarios de jobs.
4. Validaciones más estrictas en el rechazo manual de Qs.
5. Productos de Q deben estar `ACTIVE`.
6. Productos de QR permiten `DRAFT` solo en `CREATED`/`SENT`; `INACTIVE` siempre rechazado; `ACTIVE` obligatorio en `ANSWERED`.

---

## 2. Endpoints afectados

### 2.1 Q — Quotations

| Endpoint | Método | Cambio |
|----------|--------|--------|
| `/ip/q/{id_quotation}` | `PUT` | El campo `paymentTerms` solo se persiste si el usuario tiene `EDIT_PAYMENT_TERMS_IP_QUOTATIONS`. Sin el permiso se ignora silenciosamente. |
| `/ip/q/{id_quotation}/change-status?status=COMPLETE` | `PATCH` | Ahora requiere permiso `COMPLETE_IP_QUOTATIONS` además de ≥1 PO asociada. |
| `/ip/q/{id_quotation}` | `DELETE` | Rechazo manual ahora valida: (a) todas las QR asociadas en `COMPLETE`/`REJECTED`; (b) sin POs o todas las POs en `REJECTED`. |
| `/ip/q/{id_quotation}/change-status` | `PATCH` (cualquier transición) | Valida que todos los productos estén `ACTIVE` (excepto transiciones a `REJECTED`). |
| `/ip/q/{id_quotation}/quote-requests` | `POST` / `DELETE` | Si la Q está en `COMPLETE`/`REJECTED` devuelve `ip.q.not-editable-by-status`. |
| `/ip/q/{id_quotation}/products` | `POST` / `PUT` | Solo productos maestros `ACTIVE`. No se permite `productId` duplicado dentro del request ni en la Q. |

### 2.2 QR — Quote Requests

| Endpoint | Método | Cambio |
|----------|--------|--------|
| `/ip/qr/{qr_id}/products` | `POST` / `PUT` | Estado del producto validado según estado de la QR: `CREATED`/`SENT` permiten `ACTIVE`/`DRAFT` (no `INACTIVE`); `ANSWERED` solo `ACTIVE`. |

---

## 3. Nuevos permisos requeridos

| ID | Acción | Módulo | Cuánde se usa |
|----|--------|--------|---------------|
| `4003007` | `COMPLETE_IP_QUOTATIONS` | IP Quotations | Para completar manualmente una Q (`ANSWERED → COMPLETE`). **No viene en roles por defecto.** |
| `4003006` | `EDIT_PAYMENT_TERMS_IP_QUOTATIONS` | IP Quotations | Para sobrescribir `paymentTerms` en el `PUT` de Q. Ya existía en BD pero ahora se aplica. |

> Nota: el permiso `COMPLETE_IP_QUOTE_REQUESTS` (`4002004`) de QR sigue igual.

---

## 4. Nuevos códigos de error

### 4.1 Q

| Key | HTTP | Cuándo se dispara |
|-----|------|-------------------|
| `ip.q.no-manual-complete` | `400` | `COMPLETE` manual sin permiso `COMPLETE_IP_QUOTATIONS`. |
| `ip.q.manual-complete-requires-answered` | `400` | `COMPLETE` manual desde estado distinto de `ANSWERED`. |
| `ip.q.qr-not-completed-or-rejected` | `400` | Rechazo manual con QR asociadas no terminadas. |
| `ip.q.po-not-all-rejected` | `400` | Rechazo manual con POs asociadas no todas `REJECTED`. |
| `ip.q.product.not-active` | `400` | Cambio de estado con productos no `ACTIVE`. |
| `ip.q.auto-rejected-time` | — | Mensaje de historial (no devuelto como error de API). |

### 4.2 QR

| Key | HTTP | Cuándo se dispara |
|-----|------|-------------------|
| `ip.qr.product.draft-not-allowed` | `400` | Agregar/editar producto `DRAFT` en QR `ANSWERED`. |
| `ip.qr.product.inactive-not-allowed` | `400` | Agregar/editar producto `INACTIVE` en cualquier estado de QR. |

---

## 5. Reglas de UI/UX

### 5.1 Pantalla de Q (edición)

- **Campo `paymentTerms`:**
  - Si el usuario **no** tiene `EDIT_PAYMENT_TERMS_IP_QUOTATIONS`, mostrar el campo como **solo lectura** o deshabilitado.
  - Si lo tiene, permitir edición normal.
- **Botón / acción `COMPLETE`:**
  - Ocultar o deshabilitar si la Q no está en `ANSWERED`.
  - Ocultar o deshabilitar si el usuario **no** tiene `COMPLETE_IP_QUOTATIONS`.
  - Mostrar tooltip: "Se requiere permiso Complete Quotation".
- **Botón / acción `REJECT`:**
  - Deshabilitar si la Q tiene QR asociadas no `COMPLETE`/`REJECTED`.
  - Deshabilitar si tiene POs asociadas no `REJECTED`.
  - Mostrar mensajes explicativos antes de intentar el rechazo.
- **Estados finales (`COMPLETE`/`REJECTED`):**
  - Deshabilitar **toda** edición de campos, productos, cargos y QR.
  - Mostrar indicador visual de "documento finalizado".
- **Transiciones de estado:**
  - Antes de enviar `change-status`, si hay productos no `ACTIVE`, el backend rechazará con `ip.q.product.not-active`. Se recomienda validar/visualizar productos inactivos en la grilla.

### 5.2 Pantalla de QR (edición de productos)

- **Grilla de productos en estado `CREATED`/`SENT`:**
  - Permitir agregar productos `ACTIVE` o `DRAFT`.
  - Bloquear productos `INACTIVE` con mensaje `ip.qr.product.inactive-not-allowed`.
- **Grilla de productos en estado `ANSWERED`:**
  - Solo permitir productos `ACTIVE`.
  - Bloquear `DRAFT` con mensaje `ip.qr.product.draft-not-allowed`.
- **Transición `SENT → ANSWERED`:**
  - Ya valida `ACTIVE` (`ip.qr.products-not-active`). Mostrar pre-validación en UI si es posible.

### 5.3 Jobs programados

- El auto-rechazo de QR corre a las **00:05**.
- El auto-rechazo de Q corre a las **00:10**.
- Considerar mostrar avisos de "próximo a vencer" (30 días sin actividad) en los listados.

---

## 6. Notas técnicas

- No hay cambios en los **contratos de entrada/salida** de los endpoints (mismos DTOs/respuestas).
- El permiso `COMPLETE_IP_QUOTATIONS` se valida en el servicio, no en el controlador, igual que `COMPLETE_IP_QUOTE_REQUESTS` en QR.
- El auto-rechazo de Q ya no usa el mensaje legacy `ip.q.cannot-reject-with-po`; ahora usa `ip.q.po-not-all-rejected` para rechazos manuales y omite Qs `ANSWERED` con POs activas en el job.

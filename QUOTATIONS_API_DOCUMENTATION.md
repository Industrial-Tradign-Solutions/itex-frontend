# 📘 IP Quotations API Documentation

**Base URL:** `/itex/api/ip/q`

**Version:** 2.3
**Date:** May 18, 2026 (Actual Endpoints)

---

## 📋 Table of Contents

1. [Authentication & Permissions](#authentication--permissions)
2. [Controller Structure](#controller-structure)
3. [Enums & Constants](#enums--constants)
4. [Main Quotation Endpoints](#main-quotation-endpoints)
5. [Quote Request Management](#quote-request-management) 👈 UPDATED
6. [Product Management Endpoints](#product-management-endpoints)
7. [Other Charges Management](#other-charges-management)
8. [QR Other Charges from Quotation](#qr-other-charges-from-quotation) 👈 UPDATED
9. [Integrity Validation](#integrity-validation)
10. [History & Tracking](#history--tracking)
11. [Error Handling](#error-handling)

---

## 🔐 Authentication & Permissions

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### Required Permissions

| Permission ID | Name | Description |
|--------------|------|-------------|
| `4003001` | `CREATE_IP_QUOTATIONS` | Create new quotations |
| `4003002` | `UPDATE_IP_QUOTATIONS` | Update, add/remove QRs, manage products |
| `4003003` | `VIEW_HISTORY_IP_QUOTATIONS` | View quotation history |
| `4003004` | `CLONE_IP_QUOTATIONS` | Clone existing quotations |
| `4003005` | `REJECT_IP_QUOTATIONS` | Reject quotations |
| `4003006` | `EDIT_PAYMENT_TERMS_IP_QUOTATIONS` | Edit payment terms (checked within UPDATE) |
| `IP_QUOTATIONS` | Module access | List, view, open/close, change status |

---

## 🏗️ Controller Structure

The Quotations module is organized into **three controllers** for better separation of concerns:

### 1. **IpQuotationController** 
**Base URL:** `/itex/api/ip/q`

Handles main quotation operations:
- ✅ Create quotation
- ✅ Update quotation (fields, status, reject)
- ✅ Clone quotation
- ✅ List/paginate quotations
- ✅ Open/close/lock operations
- ✅ View history

### 2. **IpQuotationProductController**
**Base URL:** `/itex/api/ip/q/{id_quotation}/product`

Handles product management:
- ✅ Add product to quotation
- ✅ Update product (profit margin, condition)
- ✅ Get product details
- ✅ Remove product from quotation

### 3. **IpQuoteRequestController** (consulta)
**Base URL:** `/itex/api/ip/qr`

Handles Quote Request consultation:
- ✅ List available QRs for client (available-for-quotation)

### 4. **IpQuotationController** (Quote Request Management) 👈 UPDATED
**Base URL:** `/itex/api/ip/q`

Handles Quote Request linking within Quotation:
- ✅ Add QRs to quotation (`POST /ip/q/{id}/quote-requests`)
- ✅ Remove QR from quotation (`DELETE /ip/q/{id}/quote-requests/{id_qqr}`)
- ✅ Get Other Charges from QRs (`GET /ip/q/{id}/quote-requests/other-charges`)

### 5. **IpQuotationOtherChargeController** 👈 NEW
**Base URL:** `/itex/api/ip/q/{id_quotation}/other_charges`

Handles Other Charges (freight, handling, insurance, etc.):
- ✅ Add other charge to quotation
- ✅ Update other charge
- ✅ Get other charge details
- ✅ Remove other charge from quotation

**Important:** Other Charges can only be modified when Quotation is in `CREATED` status.

**Pattern:** Each controller handles one responsibility, following RESTful and domain-driven design principles.

---

## 📊 Enums & Constants

### IpQuotationStatus

```json
{
  "CREATED": "Quotation created, can be edited",
  "SENT": "Quotation sent to client",
  "ANSWERED": "Client has answered the quotation",
  "COMPLETE": "Quotation completed/closed",
  "REJECTED": "Quotation rejected"
}
```

**Status Flow:**
```
CREATED → SENT → ANSWERED → COMPLETE
    ↓        ↓         ↓
       REJECTED
```

### IpQuotationProductCondition

```json
{
  "NEW": "New product condition",
  "USED": "Used product condition"
}
```

### Currency (from common)

```
USD, EUR, GBP, etc.
```

### LeadTime (from common)

```
DAYS, WEEKS, MONTHS, YEARS
```

### Incoterms (from common)

```
EXW, FCA, FAS, FOB, CFR, CIF, CPT, CIP, DAP, DPU, DDP
```

### PaymentTerms (from common)

```
NET_15, NET_30, NET_45, NET_60, ADVANCE_PAYMENT, etc.
```

---

## 📦 Main Quotation Endpoints

### 1. Create Quotation

**POST** `/ip/q`

Creates a new quotation with optional initial Quote Requests.

**Permission:** `CREATE_IP_QUOTATIONS` (4003001)

**Request Body:**
```json
{
  "clientId": "uuid",
  "currency": "USD",
  "listQrId": ["uuid-qr1", "uuid-qr2"]  // Optional - initial QR to link
}
```

**Validation:**
- `clientId` (UUID): Required - Client identifier
- `currency` (Enum): Required - USD, EUR, GBP, CAD, MXN
- `listQrId` (List\<UUID\>): Optional - Quote Request IDs to link on creation

**Notes:**
- `paymentTerms` and `incoterms` are NOT set on create - they come from the linked Quote Requests or must be set via Update endpoint
- `observations` field is not available - use `remarks` (client-visible) or `internalRemarks` (internal) after creation

**Response:** `200 OK`
```json
{
  "title": "Success",
  "message": "The Q has been successfully created",
  "data": {
    "id": "uuid",
    "number": "Q-IP-000001",
    "name": "Q-IP-000001",
    "status": "CREATED",
    "currency": "USD",
    "paymentTerms": "NET_30",
    "incoterms": "FOB",
    "observations": "Quotation for industrial equipment",
    "client": {
      "id": "uuid",
      "name": "Client Name"
    },
    "openBy": null,
    "openAt": null,
    "sentAt": null,
    "acceptedAt": null,
    "closedAt": null,
    "rejectAt": null,
    "createdAt": "2026-05-04T10:30:00Z",
    "updatedAt": "2026-05-04T10:30:00Z",
    "quoteRequests": [],
    "products": [],
    "otherCharges": [],  // 👈 NEW - starts empty
    "totalOtherCharges": 0.00  // 👈 NEW - calculated from otherCharges
  },
  "openAndLockType": "EDIT",
  "isNew": true
}
```

**Errors:**
- `400` - Client or currency missing
- `400` - QR client/currency mismatch
- `404` - Client or QR not found

---

### 2. Update Quotation

**PUT** `/ip/q/{id_quotation}`

Updates an existing quotation's details.

**Permission:** `UPDATE_IP_QUOTATIONS` (4003002)

**URL Parameters:**
- `id_quotation` (UUID): Quotation ID

**Request Body:**
```json
{
  "clientId": "uuid",                  // Required (but shouldn't change after creation)
  "currency": "USD",                   // Required (but shouldn't change after creation)
  "clientContactId": "uuid",           // Optional
  "clientQrNumber": "CLIENT-REF-123",  // Optional
  "salesRepId": "uuid",                // Required
  "remarks": "Client-visible notes",   // Optional
  "internalRemarks": "Internal only",  // Optional
  "leadTime": 30,                      // Optional
  "leadTimeType": "DAYS",              // Optional
  "validity": 15,                      // Optional
  "validityType": "DAYS",              // Optional
  "incoterms": "FOB",                  // Optional
  "paymentTerms": "NET_30"             // Optional - requires EDIT_PAYMENT_TERMS permission
}
```

**Note:** To edit `paymentTerms`, user must have permission `4003006` (`EDIT_PAYMENT_TERMS_IP_QUOTATIONS`).

**Response:** `200 OK`
```json
{
  "title": "Success",
  "message": "Quotation updated successfully",
  "data": {
    "id": "uuid",
    "number": "Q-IP-000001",
    "clientContact": { "id": "uuid", "name": "John Doe" },
    "clientQNumber": "CLIENT-REF-123",
    "salesRep": { "id": "uuid", "fullName": "Jane Smith" },
    "remarks": "Client-visible notes",
    "internalRemarks": "Internal only",
    "leadTime": 30,
    "leadTimeType": "DAYS",
    "validity": 15,
    "validityType": "DAYS",
    "incoterms": "FOB",
    "paymentTerms": "NET_30"
  }
}
```

**Errors:**
- `403` - Missing EDIT_PAYMENT_TERMS permission (when updating paymentTerms)
- `404` - Quotation not found

---

### 3. List Quotations (Paginated)

**GET** `/ip/q?page=0&size=20`

Lists all quotations with pagination and filtering.

**Permission:** Module access `IP_QUOTATIONS`

**Query Parameters:**
- `page` (int): Page number (0-indexed), default: 0
- `size` (int): Items per page, default: 20
- `sort` (string): Sort field, default: "createdAt"
- `direction` (string): "ASC" or "DESC", default: "DESC"

**Additional filters (optional):**
- `status` (IpQuotationStatus): Filter by status
- `clientId` (UUID): Filter by client
- `salesRepId` (UUID): Filter by sales rep
- `number` (string): Search by quotation number
- `fromDate` (ISO 8601): Filter from date
- `toDate` (ISO 8601): Filter to date

**Response:** `200 OK`
```json
{
  "content": [
    {
      "id": "uuid",
      "number": "Q-IP-000001",
      "name": "Quote Request #Q-IP-000001",
      "client": { "id": "uuid", "name": "Client Name" },
      "status": "CREATED",
      "salesRep": { "id": "uuid", "fullName": "Jane Smith" },
      "applicationAt": "2026-05-04T10:30:00Z",
      "createdAt": "2026-05-04T10:30:00Z"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20
  },
  "totalElements": 45,
  "totalPages": 3
}
```

---

### 4. Open/Lock Quotation (Returns Full Details)

**PATCH** `/ip/q/open-lock/{id_quotation}?type=EDIT`

Opens and locks a quotation for editing while returning full quotation details.

**Permission:** Module access `IP_QUOTATIONS`

**URL Parameters:**
- `id_quotation` (UUID): Quotation ID

**Query Parameters:**
- `type` (OpenAndLockType): Required - `EDIT` or `VIEW`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "number": "Q-IP-000001",
  "name": "Quote Request #Q-IP-000001",
  "status": "CREATED",
  "currency": "USD",
  "client": {
    "id": "uuid",
    "name": "Client Company Inc.",
    "code": "CLI-001"
  },
  "clientContact": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@client.com"
  },
  "clientQNumber": "CLIENT-REF-123",
  "salesRep": {
    "id": "uuid",
    "fullName": "Jane Smith",
    "email": "jane@itex.com"
  },
  "remarks": "Client-visible notes",
  "internalRemarks": "Internal notes",
  "leadTime": 30,
  "leadTimeType": "DAYS",
  "validity": 15,
  "validityType": "DAYS",
  "incoterms": "FOB",
  "paymentTerms": "NET_30",
  "applicationAt": "2026-05-04T10:30:00Z",
  "pdfUrl": null,
  "openBy": { "id": "uuid", "fullName": "Current User" },
  "openAt": "2026-05-04T11:00:00Z",
  "sentAt": null,
  "answeredAt": null,
  "completeAt": null,
  "rejectAt": null,
  "createdAt": "2026-05-04T10:30:00Z",
  "updatedAt": "2026-05-04T10:45:00Z",
  "listQuoteRequests": [
    {
      "id": "uuid",
      "number": "QR-IP-000001",
      "status": "CREATED"
    }
  ],
  "products": [
    {
      "id": "uuid",
      "number": 1,
      "profitMargin": 15.50,
      "condition": "NEW",
      "quoteRequestProduct": {
        "id": "uuid",
        "product": {
          "id": "uuid",
          "mfrReference": "ABC-123",
          "description": "Product description"
        }
      }
    }
  ],
  "otherCharges": [],
  "totalOtherCharges": 0.00,
  "clonedByQuotation": null
},
"isOpenByUsername": true
```

**Note:** This endpoint is used to both retrieve full quotation details AND lock it for editing. Use `type=VIEW` if you only want to see details without locking.

**Errors:**
- `423` - Already locked by another user

---

### 5. Change Quotation Status

**PATCH** `/ip/q/change-status/{id_quotation}?status=SENT`

Changes the status of a quotation.

**Permission:** Module access `IP_QUOTATIONS`

**URL Parameters:**
- `id_quotation` (UUID): Quotation ID

**Query Parameters:**
- `status` (IpQuotationStatus): New status (CREATED, SENT, ANSWERED, COMPLETE)

**Allowed transitions:**
- `CREATED` → `SENT`, `REJECTED`
- `SENT` → `ANSWERED`, `COMPLETE`, `REJECTED`
- `ANSWERED` → `COMPLETE`, `REJECTED`
- `COMPLETE` → (no transitions - final state)
- `REJECTED` → (no transitions - final state)

**Response:** `200 OK`
```json
{
  "title": "Success",
  "message": "Status changed successfully",
  "data": {
    "id": "uuid",
    "number": "Q-IP-000001",
    "status": "SENT",
    "sentAt": "2026-05-04T12:00:00Z"
  }
}
```

**Errors:**
- `400` - Invalid status transition
- `404` - Quotation not found

---

### 6. Reject Quotation

**PATCH** `/ip/q/reject/{id_quotation}`

Rejects a quotation (sets status to REJECTED).

**Permission:** `REJECT_IP_QUOTATIONS` (4003005)

**URL Parameters:**
- `id_quotation` (UUID): Quotation ID

**Response:** `200 OK`
```json
{
  "title": "Success",
  "message": "Quotation rejected successfully",
  "data": {
    "id": "uuid",
    "number": "Q-IP-000001",
    "status": "REJECTED",
    "rejectAt": "2026-05-04T12:30:00Z"
  }
}
```

---

### 7. Clone Quotation

**PATCH** `/ip/q/clone/{id_quotation}`

Creates a copy of an existing quotation with all products and QRs.

**Permission:** `CLONE_IP_QUOTATIONS` (4003004)

**URL Parameters:**
- `id_quotation` (UUID): Source quotation ID to clone

**Response:** `200 OK`
```json
{
  "title": "Success",
  "message": "Quotation cloned successfully",
  "data": {
    "id": "new-uuid",
    "number": "Q-IP-000002",
    "name": "Quote Request #Q-IP-000002",
    "status": "CREATED",
    "currency": "USD",
    "client": { "id": "uuid", "name": "Client Name" },
    "listQuoteRequests": [ /* same QRs as original */ ],
    "products": [ /* same products as original */ ],
    "createdAt": "2026-05-04T13:00:00Z"
  }
}
```

**Notes:**
- New consecutive number assigned automatically
- All products are duplicated with same profit margins and conditions
- All QRs are linked to the new quotation
- **All Other Charges are cloned** (freight, handling, insurance, etc.)
- Original quotation remains unchanged
- History records CLONE action in original and CREATE in new quotation
- **Cloned relationship is registered** in `t_ip_quotations_cloned` table 👈 NEW
- The cloned quotation will show `clonedByQuotation` field when retrieved 👈 NEW

---

### 8. Open/Lock Quotation

**PATCH** `/ip/q/open-lock/{id_quotation}`

Opens and locks a quotation for editing (prevents concurrent edits).

**Permission:** Module access `IP_QUOTATIONS`

**URL Parameters:**
- `id_quotation` (UUID): Quotation ID

**Response:** `200 OK`
```json
{
  "title": "Success",
  "message": "Quotation opened",
  "data": {
    "openAndLockType": "EDIT",
    "isLocked": true
  }
}
```

**Errors:**
- `423` - Already locked by another user

---

### 9. Close/Unlock Quotation

**PATCH** `/ip/q/close/{id_quotation}`

Closes and unlocks a quotation.

**Permission:** Module access `IP_QUOTATIONS`

**URL Parameters:**
- `id_quotation` (UUID): Quotation ID

**Response:** `200 OK`
```json
{
  "title": "Success",
  "message": "Quotation closed"
}
```

---

### 10. Load Currently Open Quotation

**GET** `/ip/q/load-open`

Returns the quotation currently open/locked by the authenticated user.

**Permission:** Module access `IP_QUOTATIONS`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "number": "Q-IP-000001",
  "status": "CREATED",
  "openBy": { "id": "current-user-uuid", "fullName": "Current User" },
  "openAt": "2026-05-04T11:00:00Z"
}
```

**Response if no quotation open:** `204 No Content`

---

### 11. Close Multiple Quotations

**PATCH** `/ip/q/close-list`

Closes/unlocks all quotations currently open by the authenticated user.

**Permission:** Module access `IP_QUOTATIONS`

**Response:** `200 OK`
```json
{
  "title": "Success",
  "message": "All quotations closed"
}
```

---

## 🛍️ Product Management Endpoints

**Base URL:** `/itex/api/ip/q/{id_quotation}/product`

**Important:** All product operations automatically register history. You only need to call CRUD endpoints - history is handled by the system.

### 1. Add Product to Quotation

**POST** `/ip/q/{id_quotation}/product`

Adds a new product to a quotation.

**Permission:** `UPDATE_IP_QUOTATIONS` (4003002)

**URL Parameters:**
- `id_quotation` (UUID): Quotation ID

**Request Body:**
```json
{
  "quotationsQuoteRequestId": "uuid",  // Required - must belong to this quotation
  "quoteRequestProductId": "uuid",     // Optional - link to QR product
  "profitMargin": 15.50,               // Required - percentage
  "condition": "NEW"                   // Required - NEW or USED
}
```

**Response:** `201 Created`
```json
{
  "title": "Success",
  "message": "Product added to quotation",
  "data": {
    "id": "uuid",
    "number": 1,
    "profitMargin": 15.50,
    "condition": "NEW",
    "quotationsQuoteRequest": {
      "id": "uuid",
      "quoteRequest": {
        "id": "uuid",
        "number": "QR-IP-000001"
      }
    },
    "quoteRequestProduct": {
      "id": "uuid",
      "product": {
        "id": "uuid",
        "mfrReference": "ABC-123",
        "description": "Product description"
      }
    }
  }
}
```

**Errors:**
- `400` - Product already exists in this quotation (if linking to QR product)
- `404` - Quotation or QR not found
- `400` - QR doesn't belong to this quotation

---

### 2. Update Product

**PUT** `/ip/q/{id_quotation}/product/{id_q_product}`

Updates an existing product in a quotation.

**Permission:** `UPDATE_IP_QUOTATIONS` (4003002)

**URL Parameters:**
- `id_quotation` (UUID): Quotation ID
- `id_q_product` (UUID): Product ID

**Request Body:**
```json
{
  "quotationsQuoteRequestId": "uuid",
  "quoteRequestProductId": "uuid",
  "profitMargin": 18.00,
  "condition": "USED"
}
```

**Response:** `200 OK`
```json
{
  "title": "Success",
  "message": "Product updated successfully",
  "data": {
    "id": "uuid",
    "number": 1,
    "profitMargin": 18.00,
    "condition": "USED"
  }
}
```

**Errors:**
- `404` - Product or quotation not found
- `400` - Duplicate product reference

---

### 3. Get Product Details

**GET** `/ip/q/{id_quotation}/product/{id_q_product}`

Retrieves details of a specific product.

**Permission:** `UPDATE_IP_QUOTATIONS` (4003002)

**URL Parameters:**
- `id_quotation` (UUID): Quotation ID
- `id_q_product` (UUID): Product ID

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "number": 1,
  "profitMargin": 15.50,
  "condition": "NEW",
  "quoteRequestProduct": {
    "id": "uuid",
    "product": {
      "id": "uuid",
      "mfrReference": "ABC-123",
      "description": "Product description",
      "manufacturer": { "id": "uuid", "name": "Manufacturer Name" }
    },
    "quantity": 10,
    "unitPrice": 100.00
  }
}
```

---

### 4. Remove Product

**DELETE** `/ip/q/{id_quotation}/product/{id_q_product}`

Removes a product from a quotation.

**Permission:** `UPDATE_IP_QUOTATIONS` (4003002)

**URL Parameters:**
- `id_quotation` (UUID): Quotation ID
- `id_q_product` (UUID): Product ID

**Response:** `200 OK`
```json
{
  "title": "Success",
  "message": "Product removed successfully",
  "data": "uuid"  // Deleted product ID
}
```

---

## 🔗 Quote Request Management 👈 UPDATED

**Base URLs:**
- `/itex/api/ip/qr` - Para consultar QR disponibles para crear Quotation
- `/itex/api/ip/q/{id_quotation}/quote-requests` - Para gestionar QR dentro de una Quotation

**Important:** All QR add/remove operations automatically register history (ADD_QR, REMOVE_QR). You only need to call the endpoints - history is handled by the system.

### 1. List Available Quote Requests (NEW Location)

**GET** `/ip/qr/available-for-quotation/{id_client}`

Returns a list of Quote Requests available to be linked to a quotation for a specific client.

**Permission:** `CREATE_IP_QUOTATIONS` (4003001)

**URL Parameters:**
- `id_client` (UUID): Client ID to filter Quote Requests

**Query Parameters:**
- `view-completed-qr` (boolean): Include completed QRs, default: `false`
- `currency` (Currency): Filter by currency, default: `USD`

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "number": "QR-IP-000001",
    "status": "CREATED",
    "client": { "id": "uuid", "name": "Client Name" },
    "currency": "USD",
    "createdAt": "2026-05-01T10:00:00Z"
  },
  {
    "id": "uuid",
    "number": "QR-IP-000002",
    "status": "SENT",
    "client": { "id": "uuid", "name": "Client Name" },
    "currency": "USD",
    "createdAt": "2026-05-02T11:00:00Z"
  }
]
```

---

### 2. Add Quote Requests to Quotation

**POST** `/ip/q/{id_quotation}/quote-requests`

Links existing Quote Requests to a quotation.

**Permission:** `UPDATE_IP_QUOTATIONS` (4003002)

**URL Parameters:**
- `id_quotation` (UUID): Quotation ID

**Request Body:**
```json
{
  "quoteRequestIds": ["qr-uuid-1", "qr-uuid-2", "qr-uuid-3"]
}
```

**Validations:**
- All QRs must belong to the same client as the quotation
- All QRs must use the same currency as the quotation
- QRs cannot already be linked to this quotation

**Response:** `200 OK`
```json
{
  "title": "Success",
  "message": "Quote Requests added successfully",
  "data": {
    "id": "uuid",
    "number": "Q-IP-000001",
    "listQuoteRequests": [
      { "id": "qr-uuid-1", "number": "QR-IP-000001" },
      { "id": "qr-uuid-2", "number": "QR-IP-000002" },
      { "id": "qr-uuid-3", "number": "QR-IP-000003" }
    ]
  }
}
```

**Errors:**
- `400` - Client mismatch: `"The Quote Request {number} does not belong to the same client as the Quotation"`
- `400` - Currency mismatch: `"The Quote Request {number} does not use the same currency as the Quotation"`
- `400` - Already linked: `"Quote Request already linked to this quotation"`

---

### 3. Remove Quote Request from Quotation

**DELETE** `/ip/q/{id_quotation}/quote-requests/{id_qqr}`

Unlinks a Quote Request from a quotation.

**Permission:** `UPDATE_IP_QUOTATIONS` (4003002)

**URL Parameters:**
- `id_quotation` (UUID): Quotation ID
- `id_qqr` (UUID): Quotation-QuoteRequest link ID (from listQuoteRequests)

**Response:** `200 OK`
```json
{
  "title": "Success",
  "message": "Quote Request removed successfully",
  "data": "uuid"  // Removed link ID
}
```

**Note:** Removing a QR will also remove all products linked to that QR.

---

## 💰 Other Charges Management 👈 NEW

**Base URL:** `/itex/api/ip/q/{id_quotation}/other_charges`

**Important:** All Other Charges operations automatically register history (ADD_OTHER_CHARGE, UPDATE_OTHER_CHARGE, REMOVE_OTHER_CHARGE). You only need to call CRUD endpoints - history is handled by the system.

**⚠️ Constraint:** Other Charges can only be modified when Quotation is in `CREATED` status.

### 1. Add Other Charge to Quotation

**POST** `/ip/q/{id_quotation}/other_charges`

Adds a new other charge to a quotation (freight, handling, insurance, etc.).

**Permission:** `UPDATE_IP_QUOTATIONS` (4003002)

**URL Parameters:**
- `id_quotation` (UUID): Quotation ID

**Request Body:**
```json
{
  "description": "Freight Charges",
  "value": 250.00
}
```

**Validation:**
- `description` (String, required): Description of the charge (unique per quotation)
- `value` (BigDecimal, required): Amount (must be >= 0)
- Quotation must be in `CREATED` status
- Description must be unique within the quotation

**Response:** `201 Created`
```json
{
  "title": "Success",
  "message": "The Other Charge has been successfully added to the Quotation",
  "data": {
    "id": "uuid",
    "description": "FREIGHT CHARGES",  // Auto-capitalized
    "value": 250.00,
    "createdAt": "2026-05-04T10:30:00Z"
  }
}
```

**Errors:**
- `400` - Quotation not in CREATED status: `"Quotation must be in CREATED status to perform this operation"`
- `400` - Duplicate description: `"The Other Charge description already exists in this Quotation"`
- `404` - Quotation not found

---

### 2. Update Other Charge

**PUT** `/ip/q/{id_quotation}/other_charges/{id_other_charge}`

Updates an existing other charge in a quotation.

**Permission:** `UPDATE_IP_QUOTATIONS` (4003002)

**URL Parameters:**
- `id_quotation` (UUID): Quotation ID
- `id_other_charge` (UUID): Other Charge ID

**Request Body:**
```json
{
  "description": "International Freight",
  "value": 350.00
}
```

**Validation:**
- Quotation must be in `CREATED` status
- Description must be unique (excluding current charge)

**Response:** `200 OK`
```json
{
  "title": "Success",
  "message": "The Other Charge has been successfully updated",
  "data": {
    "id": "uuid",
    "description": "INTERNATIONAL FREIGHT",
    "value": 350.00,
    "createdAt": "2026-05-04T10:30:00Z"
  }
}
```

**Errors:**
- `400` - Quotation not in CREATED status
- `400` - Duplicate description

---

### 3. Get Other Charge Details

**GET** `/ip/q/{id_quotation}/other_charges/{id_other_charge}`

Retrieves details of a specific other charge.

**Permission:** `UPDATE_IP_QUOTATIONS` (4003002)

**URL Parameters:**
- `id_quotation` (UUID): Quotation ID
- `id_other_charge` (UUID): Other Charge ID

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "description": "FREIGHT CHARGES",
  "value": 250.00,
  "createdAt": "2026-05-04T10:30:00Z"
}
```

---

### 4. Remove Other Charge

**DELETE** `/ip/q/{id_quotation}/other_charges/{id_other_charge}`

Removes an other charge from a quotation.

**Permission:** `UPDATE_IP_QUOTATIONS` (4003002)

**URL Parameters:**
- `id_quotation` (UUID): Quotation ID
- `id_other_charge` (UUID): Other Charge ID

**Validation:**
- Quotation must be in `CREATED` status

**Response:** `200 OK`
```json
{
  "title": "Success",
  "message": "The Other Charge has been successfully removed from the Quotation",
  "data": "uuid"  // Deleted other charge ID
}
```

**Errors:**
- `400` - Quotation not in CREATED status

---

### 📊 Other Charges in Quotation Response

When retrieving a quotation, the `otherCharges` array is included:

```json
{
  "id": "uuid",
  "number": "Q-IP-000001",
  "status": "CREATED",
  "currency": "USD",
  // ... other fields ...
  "otherCharges": [
    {
      "id": "uuid",
      "description": "FREIGHT CHARGES",
      "value": 250.00,
      "createdAt": "2026-05-04T10:30:00Z"
    },
    {
      "id": "uuid",
      "description": "HANDLING FEE",
      "value": 50.00,
      "createdAt": "2026-05-04T11:00:00Z"
    }
  ],
  "totalOtherCharges": 300.00  // Sum of all other charges
}
```

**Calculation:** `totalOtherCharges` is calculated by summing all `value` fields in `otherCharges` array. Returns `0.00` if array is empty or null.

---

## 📊 QR Other Charges from Quotation 👈 UPDATED

**Base URL:** `/itex/api/ip/q/{id_quotation}/quote-requests`

### Get Other Charges from Quote Requests

**GET** `/ip/q/{id_quotation}/quote-requests/other-charges`

Retrieves all Other Charges from all Quote Requests associated with a quotation. Returns a flat list (not grouped by QR).

**Permission:** Module access `IP_QUOTATIONS`

**URL Parameters:**
- `id_quotation` (UUID): Quotation ID

**Response:** `200 OK`
```json
[
  { "description": "Freight", "value": 150.00, "qrNumber": "QR-2026-001" },
  { "description": "Handling", "value": 25.00, "qrNumber": "QR-2026-001" },
  { "description": "Insurance", "value": 50.00, "qrNumber": "QR-2026-002" }
]
```

**Response Fields:**
- `description` (String): Charge description
- `value` (BigDecimal): Charge amount
- `qrNumber` (String): Quote Request number (origin of the charge)

**Note:** Returns empty array if quotation has no Quote Requests or QR has no Other Charges.

---

## 🔒 Integrity Validation 👈 NEW

**Base URL:** `/itex/api/ip/q`

### Validate Quotation Integrity

**GET** `/ip/q/validate-integrity/{id_quotation}`

Validates that all Quote Requests associated with a quotation have the same client and currency as the quotation.

**Permission:** Module access `IP_QUOTATIONS`

**URL Parameters:**
- `id_quotation` (UUID): Quotation ID

**Validation Rules:**
- All QRs associated with the quotation must have the same client
- All QRs associated with the quotation must have the same currency

**Response (Valid):** `200 OK`
```json
{
  "title": "Valid",
  "message": "ip.q.integrity.valid",
  "data": []
}
```

**Response (Invalid):** `200 OK`
```json
{
  "title": "Invalid",
  "message": "ip.q.integrity.invalid",
  "data": [
    "QR QR-001 tiene problemas de integridad, pertenece a otro cliente (ClientX), por favor elimínela",
    "QR QR-002 tiene problemas de integridad, tiene una moneda diferente (EUR), por favor elimínela"
  ]
}
```

**Automatic Validation:**
This validation is also performed automatically in the following scenarios:
- **PUT /ip/q/{id_quotation}** (Update Quotation): Validates before saving
- **PATCH /ip/q/change-status/{id_quotation}** (Change Status): Validates before changing status
  - Exception: Changing to REJECTED status does NOT validate integrity
- **Future:** PDF Generation will validate before generating

**Errors (when automatic validation fails):**
- `400` - QuotationIntegrityException with list of validation errors

---

## 📜 History & Tracking

### Get Quotation History

**GET** `/ip/q/history/{id_quotation}`

Retrieves complete history of all changes made to a quotation.

**Permission:** `VIEW_HISTORY_IP_QUOTATIONS` (4003003)

**URL Parameters:**
- `id_quotation` (UUID): Quotation ID

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "action": "CREATE",
    "changedBy": {
      "id": "uuid",
      "fullName": "Jane Smith",
      "email": "jane@itex.com"
    },
    "changedAt": "2026-05-04T10:30:00Z",
    "oldValue": null,
    "newValue": {
      "number": "Q-IP-000001",
      "status": "CREATED",
      "currency": "USD",
      "client": { "id": "uuid", "name": "Client Name" }
    },
    "product": null
  },
  {
    "id": "uuid",
    "action": "ADD_QR",
    "changedBy": { "id": "uuid", "fullName": "Jane Smith" },
    "changedAt": "2026-05-04T10:35:00Z",
    "oldValue": null,
    "newValue": {
      "quoteRequest": {
        "id": "uuid",
        "number": "QR-IP-000001"
      }
    },
    "product": null
  },
  {
    "id": "uuid",
    "action": "ADD_PRODUCT",
    "changedBy": { "id": "uuid", "fullName": "Jane Smith" },
    "changedAt": "2026-05-04T10:40:00Z",
    "oldValue": null,
    "newValue": null,
    "product": {
      "id": "uuid",
      "number": 1,
      "profitMargin": 15.50,
      "condition": "NEW"
    }
  },
  {
    "id": "uuid",
    "action": "UPDATE",
    "changedBy": { "id": "uuid", "fullName": "Jane Smith" },
    "changedAt": "2026-05-04T10:45:00Z",
    "oldValue": {
      "leadTime": null,
      "leadTimeType": null,
      "paymentTerms": null
    },
    "newValue": {
      "leadTime": 30,
      "leadTimeType": "DAYS",
      "paymentTerms": "NET_30"
    },
    "product": null
  },
  {
    "id": "uuid",
    "action": "STATUS_CHANGE",
    "changedBy": { "id": "uuid", "fullName": "Jane Smith" },
    "changedAt": "2026-05-04T12:00:00Z",
    "oldValue": { "status": "CREATED" },
    "newValue": { "status": "SENT", "sentAt": "2026-05-04T12:00:00Z" },
    "product": null
  }
]
```

**Action Types:**
- `CREATE` - Quotation created
- `UPDATE` - General quotation fields updated
- `CLONE` - Quotation cloned from another
- `STATUS_CHANGE` - Status changed
- `REJECTED` - Quotation rejected
- `ADD_QR` - Quote Request added
- `REMOVE_QR` - Quote Request removed
- `ADD_PRODUCT` - Product added
- `UPDATE_PRODUCT` - Product updated
- `REMOVE_PRODUCT` - Product removed
- `ADD_OTHER_CHARGE` - Other Charge added 👈 NEW
- `UPDATE_OTHER_CHARGE` - Other Charge updated 👈 NEW
- `REMOVE_OTHER_CHARGE` - Other Charge removed 👈 NEW

### 📌 Important: History Registration Pattern

**History is automatically registered by the system** - frontend does NOT need to call history endpoints directly.

| Action | Registered In | When |
|--------|---------------|------|
| **CREATE, UPDATE, CLONE, REJECTED, STATUS_CHANGE** | Service layer | After main quotation operation |
| **ADD_PRODUCT, UPDATE_PRODUCT, REMOVE_PRODUCT** | Controller layer | After product operation |
| **ADD_QR, REMOVE_QR** | Controller layer | After QR operation |
| **ADD_OTHER_CHARGE, UPDATE_OTHER_CHARGE, REMOVE_OTHER_CHARGE** | Controller layer | After other charge operation |

**Why this pattern?**
- Main entity operations → Service (business logic location)
- Sub-entity operations (products, QRs, Other Charges) → Controller (consistent with QR module pattern)
- History is captured with `oldValue` before changes and `newValue` after changes
- Only actual changes are recorded (empty diffs are not saved)

**Frontend Responsibility:**
- ✅ Call CRUD endpoints normally (POST, PUT, DELETE)
- ✅ Call GET /history to display changes
- ❌ DO NOT call history service directly
- ❌ DO NOT manually create history records

---

## ⚠️ Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "title": "Error",
  "message": "Validation failed",
  "errors": [
    "Client is required",
    "Currency is required"
  ]
}
```

#### 403 Forbidden
```json
{
  "title": "Error",
  "message": "Missing required permission: EDIT_PAYMENT_TERMS_IP_QUOTATIONS"
}
```

#### 404 Not Found
```json
{
  "title": "Error",
  "message": "Quotation not found"
}
```

#### 423 Locked
```json
{
  "title": "Error",
  "message": "Quotation is currently locked by another user"
}
```

### Custom Business Exceptions

#### QuotationClientMismatchException
```json
{
  "title": "Error",
  "message": "The Quote Request QR-IP-000001 does not belong to the same client as the Quotation"
}
```

#### QuotationCurrencyMismatchException
```json
{
  "title": "Error",
  "message": "The Quote Request QR-IP-000001 does not use the same currency as the Quotation"
}
```

#### QuoteRequestAlreadyLinkedException
```json
{
  "title": "Error",
  "message": "Quote Request QR-IP-000001 is already linked to this Quotation"
}
```

#### QProductExistException
```json
{
  "title": "Error",
  "message": "Product already exists in this quotation"
}
```

#### IpQuotationOtherChargeExistException (NEW)
```json
{
  "title": "Error",
  "message": "The Other Charge description already exists in this Quotation"
}
```

#### IpQuotationNotInCreatedStatusException (NEW)
```json
{
  "title": "Error",
  "message": "Quotation must be in CREATED status to perform this operation"
}
```

#### QuotationIntegrityException (NEW)
```json
{
  "title": "Error",
  "message": "QR QR-001 tiene problemas de integridad, pertenece a otro cliente (ClientX), por favor elimínela; QR QR-002 tiene problemas de integridad, tiene una moneda diferente (EUR), por favor elimínela"
}
```

---

## 🔄 Automatic Processes

### Scheduler: Auto-unlock Open Quotations

**Runs:** Daily at 11:53 PM (23:53)

Automatically unlocks all quotations that have been open for more than the configured time.

### Scheduler: Auto-reject Old Quotations

**Runs:** Daily at 11:54 PM (23:54)

Automatically rejects quotations that:
- Are in `CREATED` status
- Were created more than 45 days ago
- Have not been sent to the client

---

## 📝 Notes for Frontend Implementation

### 1. Status Flow
```
CREATED → SENT → ANSWERED → COMPLETE
    ↓        ↓         ↓
       REJECTED
```

**Actual Statuses:** CREATED, SENT, ANSWERED, COMPLETE, REJECTED

### 2. Lock Management
- Always call `/open-lock/{id}` before editing
- Call `/close/{id}` when done editing or user navigates away
- Use `/load-open` on app startup to resume editing
- Use `/close-list` on logout/session end

### 3. History Display
- History is ordered by `changedAt` (newest first)
- Display `oldValue` vs `newValue` as a diff
- Product history has `product` object populated
- Actions without changes (same old/new) are not recorded

### 4. Validation
- Client and currency cannot be changed after creation
- Payment terms editing requires special permission (4003006)
- QR and product operations validate client/currency match
- Status transitions are validated server-side

### 5. Other Charges Validation 👈 NEW
- **Status Restriction:** Other Charges can only be added/updated/removed when Quotation is in `CREATED` status
- **Description Uniqueness:** Each Other Charge description must be unique within a quotation
- **Value:** Must be >= 0 (can be 0)
- **Auto-capitalization:** Description is automatically capitalized on save (e.g., "freight charges" → "FREIGHT CHARGES")
- **Total Calculation:** Use `totalOtherCharges` field or calculate manually from `otherCharges[]` array

### 6. Permissions
- Check user permissions before showing action buttons
- Hide "Edit Payment Terms" field if user lacks permission 4003006
- Disable actions based on quotation status and user permissions

---

## 🚀 Future Endpoints (Pending Implementation)

### Generate PDF (FASE 8)

**GET** `/ip/q/print/{id_quotation}`

Generates a PDF report of the quotation.

**Status:** Awaiting Jasper template from business team.

**Expected Response:** `200 OK` (application/pdf)

---

**End of Documentation**

For questions or issues, contact the backend team.

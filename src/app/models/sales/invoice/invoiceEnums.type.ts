export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIAL_PAID' | 'PAID' | 'CANCELLED';

// Quick date filter of the list endpoint. The backend binds the shared
// `common.models.enums.FilterDate` (same one used by QR/Q/PO), so only these
// four values are accepted. `ALL` removes the quick restriction and is the only
// mode where the initDate/endDate custom range is applied.
export type InvoiceFilterDate = 'ALL' | 'YEAR' | 'MONTH' | 'DAY';

// Values are driven by StaticListsService / backend enums; kept as `string`
// so a new backend value never breaks the build (same criteria as IP modules).
export type InvoiceCurrency = string;
export type InvoicePaymentTerms = string;
export type InvoiceDepartment = string;
export type InvoiceVia = string;
export type InvoiceIncoterms = string;

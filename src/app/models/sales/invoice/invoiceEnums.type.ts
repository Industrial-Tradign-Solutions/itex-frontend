export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIAL_PAID' | 'PAID' | 'CANCELLED';

// Quick date filter of the list endpoint. The backend binds the shared
// `common.models.enums.FilterDate` (same one used by QR/Q/PO), so only these
// four values are accepted — §1 of itex-invoices-api.md documents a longer enum
// (TODAY/THIS_WEEK/CUSTOM/...) that the API rejects with a conversion error.
// `ALL` removes the quick restriction and is the only mode where the
// initDate/endDate custom range is applied.
export type InvoiceFilterDate = 'ALL' | 'YEAR' | 'MONTH' | 'DAY';

// §12.4: where a PO's charge comes from. `SALES_TAX` is informative — §12.3
// imports that one as a tax record, not as a charge.
export type InvoiceChargeSource = 'OWN' | 'QUOTATION' | 'QUOTATION_QR' | 'SALES_TAX';

// Values are driven by StaticListsService / backend enums; kept as `string`
// so a new backend value never breaks the build (same criteria as IP modules).
export type InvoiceCurrency = string;
export type InvoicePaymentTerms = string;
export type InvoiceDepartment = string;
export type InvoiceVia = string;
export type InvoiceIncoterms = string;

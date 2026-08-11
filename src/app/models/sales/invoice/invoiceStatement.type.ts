import { ListInvoice } from "./listInvoice.type";

// §18.2: the outstanding balance split by days elapsed since `dueAt`.
// `current` is what is not due yet, and it also absorbs the invoices whose
// payment terms cannot produce a due date (`dueAt = null`).
export type InvoiceAging = {
  current: number;
  days1To30: number;
  days31To60: number;
  days61To90: number;
  days90Plus: number;
};

// Aggregated query over t_invoices + t_invoice_payments — no MessageResponse
// envelope, the endpoint answers the object directly.
//
// Only counts what was actually invoiced (`ISSUED`, `PARTIAL_PAID`, `PAID`):
// drafts were never billed and cancelled invoices owe nothing.
export type InvoiceStatement = {
  clientId: string;
  clientName: string;
  invoiceCount: number;
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  aging: InvoiceAging;
  // Rows of the list endpoint with `overdue = true`. The documented sample only
  // spells out the financial fields, so the statement view renders those.
  overdueInvoices: ListInvoice[];
};

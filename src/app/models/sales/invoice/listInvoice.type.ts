import { InvoiceCurrency, InvoiceStatus } from "./invoiceEnums.type";

export type InvoiceClientRef = {
  id: string;
  code: string;
  name: string;
}

export type InvoiceUserRef = {
  id: string;
  fullName: string;
  user: string;
}

// Light projection returned by `GET /sales/invoice` and `GET /sales/invoice/load-open`.
// Satisfies `ItemTab` ({id, name}) so it can drive the tabs of the page.
export type ListInvoice = {
  id: string;
  draftNumber: string;
  number: string | null;
  name: string;
  client: InvoiceClientRef;
  salesRep: InvoiceUserRef;
  status: InvoiceStatus;
  currency: InvoiceCurrency;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  dueAt: string | null;
  overdue: boolean;
  createdAt: string;
}

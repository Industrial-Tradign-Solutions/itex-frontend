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
  // §17, same as in the detail: "was paid after its due date". Optional until
  // the field shows up in the documented response samples.
  paidLate?: boolean;
  createdAt: string;
}

// Label of a tab. The `name` built by the backend is not zero-padded, while
// `draftNumber` and `number` are — the tab has to read exactly like the number
// field of the form. Once the draft is issued and receives its final number,
// that one replaces the draft number.
export const invoiceTabName = (
  invoice: { number?: string | null; draftNumber?: string | null } | undefined,
  fallback = 'New Invoice'
): string => invoice?.number || invoice?.draftNumber || fallback;

// Placeholder item of a "create" tab. Every field of ListInvoice is mandatory,
// so a partial object (what QR/PO pass) does not compile here; the real values
// arrive from the server once the draft is saved.
export const emptyListInvoice = (): ListInvoice => ({
  id: '',
  draftNumber: '',
  number: null,
  name: 'New Invoice',
  client: { id: '', code: '', name: '' },
  salesRep: { id: '', fullName: '', user: '' },
  status: 'DRAFT',
  currency: 'USD',
  totalAmount: 0,
  paidAmount: 0,
  balanceDue: 0,
  dueAt: null,
  overdue: false,
  createdAt: ''
});

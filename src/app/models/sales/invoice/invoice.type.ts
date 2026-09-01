import { BasicUser } from "@interfaces/administration/user";
import { Client, ClientContact } from "@interfaces/partners/clients";
import {
  InvoiceCurrency,
  InvoiceDepartment,
  InvoiceIncoterms,
  InvoicePaymentTerms,
  InvoiceStatus,
  InvoiceVia
} from "./invoiceEnums.type";
import { InvoiceProduct } from "./invoiceProduct.type";
import { InvoiceCharge } from "./invoiceCharge.type";
import { InvoiceTax } from "./invoiceTax.type";
import { InvoiceAssociatedPo } from "./invoicePo.type";

// Full invoice returned by `PATCH /sales/invoice/open-lock/{id}`.
// `openBy` is typed as BasicUser to satisfy the generic constraint of
// CommonPageTab ({id, name, openBy: BasicUser}); the backend sends a subset
// of that shape (id/fullName/user) and only `fullName` is rendered.
export type Invoice = {
  id: string;
  draftNumber: string;
  number: string | null;
  name: string;
  department: InvoiceDepartment;
  status: InvoiceStatus;
  currency: InvoiceCurrency;
  client: Client;
  clientContact: ClientContact | null;
  shipToName: string;
  shipToAddress: string;
  shipToCity: { id: string; name: string };
  shipToPhone: string;
  shipToContactName: string;
  shipToEmail: string;
  orderNumber: string | null;
  via: InvoiceVia | null;
  incoterms: InvoiceIncoterms;
  paymentTerms: InvoicePaymentTerms | null;
  awbBl: string | null;
  salesRep: BasicUser;
  remarks: string | null;
  internalRemarks: string | null;
  packingList: string | null;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  dueAt: string | null;
  overdue: boolean;
  // §17: derived from `paidAt > dueAt`. Survives the payment, unlike `overdue`,
  // which the server switches off as soon as the invoice is settled.
  paidLate: boolean;
  overdueNotifiedAt: string | null;
  issuedAt: string | null;
  partialPaidAt: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  pdfUrl: string | null;
  openAt: string | null;
  openBy: BasicUser;
  products: InvoiceProduct[];
  charges: InvoiceCharge[];
  taxes: InvoiceTax[];
  linkedPurchaseOrders: InvoiceAssociatedPo[];
  productsTotal: number;
  chargesTotal: number;
  taxesTotal: number;
  clonedInvoices: { id: string; number: string }[];
  clonedByInvoice: { id: string; number: string } | null;
  createdAt: string;
}

// Envelope of the open-lock endpoint: `isValidOpen = false` means the invoice
// is locked by another user and must be rendered read-only.
export type InvoiceOpenAndLock = {
  data: Invoice;
  isValidOpen: boolean;
}

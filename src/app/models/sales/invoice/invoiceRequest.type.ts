import {
  InvoiceCurrency,
  InvoiceIncoterms,
  InvoicePaymentTerms,
  InvoiceVia
} from "./invoiceEnums.type";

// Body of `POST /sales/invoice`. The ship-to block is deliberately absent: the
// backend copies it from the client (denormalized snapshot), and `salesRep`,
// `status`, `draftNumber` and `paymentTerms` are assigned server-side.
// `department` is omitted too — it defaults to `IP`, the only one that exists.
export type InvoiceCreateRequest = {
  clientId: string;
  clientContactId: string | null;
  incoterms: InvoiceIncoterms;
  currency: InvoiceCurrency;
  via: InvoiceVia | null;
  orderNumber: string | null;
  awbBl: string | null;
  remarks: string | null;
  internalRemarks: string | null;
  packingList: string | null;
}

// Body of `PUT /sales/invoice/{id}`. Only applies to invoices in DRAFT; the six
// ship-to fields become mandatory because there is no autofill on update.
// `paymentTerms` and `salesRepId` are permission-gated server-side
// (EDIT_PAYMENT_TERMS_INVOICE / CHANGE_SALES_REP_INVOICE).
export type InvoiceUpdateRequest = InvoiceCreateRequest & {
  paymentTerms: InvoicePaymentTerms | null;
  salesRepId: string | null;
  shipToName: string;
  shipToAddress: string;
  shipToCityId: string;
  shipToPhone: string;
  shipToContactName: string;
  shipToEmail: string;
}

// Empty strings coming from cleared inputs must travel as null, not as '' —
// the backend size validators would accept '' and persist an empty value.
const orNull = (value: unknown): string | null =>
  value === undefined || value === null || value === '' ? null : `${value}`;

export const mapToInvoiceCreateRequest = (raw: any): InvoiceCreateRequest => ({
  clientId: raw.clientId,
  clientContactId: orNull(raw.clientContactId),
  incoterms: raw.incoterms,
  currency: raw.currency,
  via: orNull(raw.via),
  orderNumber: orNull(raw.orderNumber),
  awbBl: orNull(raw.awbBl),
  remarks: orNull(raw.remarks),
  internalRemarks: orNull(raw.internalRemarks),
  packingList: orNull(raw.packingList)
});

export const mapToInvoiceUpdateRequest = (raw: any): InvoiceUpdateRequest => ({
  ...mapToInvoiceCreateRequest(raw),
  paymentTerms: orNull(raw.paymentTerms),
  // Echo of the current sales rep when the control is disabled: the backend
  // ignores it as long as it did not change, but sending null would be a change.
  salesRepId: orNull(raw.salesRepId),
  shipToName: raw.shipToName,
  shipToAddress: raw.shipToAddress,
  shipToCityId: raw.shipToCityId,
  shipToPhone: raw.shipToPhone,
  shipToContactName: raw.shipToContactName,
  shipToEmail: raw.shipToEmail
});

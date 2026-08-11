import { BasicUser } from "@interfaces/administration/user";

// Driven by the `payment_methods` static list (ACH, CREDIT_CARD,
// WIRE_TRANSFER, CHECK). Kept as `string` so a new backend value never breaks
// the build — same criteria as the other invoice enums.
export type InvoicePaymentMethod = string;

// §16: payments are immutable. A wrong one is voided (never edited, never
// deleted) and a new record is created, which is why the voided fields travel
// in the same row instead of a separate audit table.
export type InvoicePayment = {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: InvoicePaymentMethod;
  // The physical path of the receipt is deliberately not exposed by the API;
  // only the original file name, to show it as it was uploaded.
  receiptOriginalName: string;
  notes: string | null;
  voided: boolean;
  voidedReason: string | null;
  voidedAt: string | null;
  voidedBy: BasicUser | null;
  registeredBy: BasicUser;
  createdAt: string;
};

// JSON part of the multipart `POST /{id}/payment`. The receipt file travels as
// the second part and is mandatory, so it is not part of this type.
export type InvoicePaymentRequest = {
  amount: number;
  // `YYYY-MM-DD` — the backend binds a LocalDate, not an instant.
  paymentDate: string;
  paymentMethod: InvoicePaymentMethod;
  notes: string | null;
};

export type InvoicePaymentVoidRequest = {
  voidedReason: string;
};

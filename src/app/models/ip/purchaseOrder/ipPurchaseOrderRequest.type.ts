export type CreatePurchaseOrderRequest = {
  clientId: string;
  quotationId?: string;
  supplierId?: string;
}

// §2.4 — near-full replacement body. Conditional fields (clientId/currency/supplierId)
// are still sent; the backend ignores/validates them per the quotation rules.
export type UpdatePurchaseOrderRequest = {
  clientId: string;
  clientContactId: string | null;
  clientPoNumber: string | null;
  currency: string;
  supplierId: string | null;
  supplierContactId: string | null;
  supplierPoNumber: string | null;
  paymentTerms: string | null;
  shippingMethod: string | null;
  salesRepId: string;
  leadTime: number;
  leadTimeType: string;
  salesTax: number;
  shipToName: string;
  shipToAddress: string;
  shipToCityId: string;
  shipToPhone: string;
  shipToContactName: string;
  shipToEmail: string;
  status?: string;
  remarks?: string | null;
  internalRemarks?: string | null;
}

// §2.6
export type ChangeQuotationRequest = {
  quotationId: string;
}

// §3.2
export type AddPurchaseOrderProductsRequest = {
  quotationProductIds: string[];
}

// §4.1 / §4.2
export type PurchaseOrderOtherChargeRequest = {
  description: string;
  value: number;
}

// §4.5 / §4.9
export type ImportPurchaseOrderChargesRequest = {
  chargeIds: string[];
}

// §3.1 — a quotation product still addable to the PO. sellingUnitPrice/
// sellingExtendedPrice already include the Quotation's profit margin.
export type EligibleIpPurchaseOrderProduct = {
  quotationProductId: string;
  description: string;
  mfrReference: string;
  quantity: number;
  sellingUnitPrice: number;
  sellingExtendedPrice: number;
  qrNumber: string;
}

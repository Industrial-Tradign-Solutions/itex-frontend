// §4.9/§5 — imported-from-Quotation-QR charge. The actual description/value are
// two levels deep: quotationQrOtherCharge.qrOtherCharge.{description,value}.
export type IpPurchaseOrderQrOtherCharge = {
  id: string;
  description: string;
  value: number;
};

export type IpPurchaseOrderOtherChargesQuotationQr = {
  id: string;
  quotationQrOtherCharge: {
    id: string;
    qrOtherCharge: IpPurchaseOrderQrOtherCharge | null;
  } | null;
}

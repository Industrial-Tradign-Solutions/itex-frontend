export type IpQuotationImportedOtherCharge = {
  id: string;
  quotationsQuoteRequestId: string;
  qrOtherCharge: {
    id: string;
    value: number;
    description: string;
  }
}

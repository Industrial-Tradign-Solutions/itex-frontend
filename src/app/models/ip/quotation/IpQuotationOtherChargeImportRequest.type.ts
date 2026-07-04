export type IpQuotationOtherChargeImportItem = {
  quotationsQuoteRequestId: string;
  qrOtherChargeId: string;
}

export type IpQuotationOtherChargeImportRequest = {
  items: IpQuotationOtherChargeImportItem[];
}

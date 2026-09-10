export type IpQuotationProductRequest = {
  quotationsQuoteRequestId: string;
  quoteRequestProductId: string;
  profitMargin: number;
  condition: string;
  itsLeadTime: number;
};

export type IpQuotationProductBulkRequest = {
  products: IpQuotationProductRequest[];
};

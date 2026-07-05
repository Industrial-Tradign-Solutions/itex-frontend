export type IpQuotationProductBulkItemRequest = {
  quotationsQuoteRequestId: string;
  quoteRequestProductId: string;
  profitMargin: number;
  condition: string;
};

export type IpQuotationProductBulkRequest = {
  products: IpQuotationProductBulkItemRequest[];
};

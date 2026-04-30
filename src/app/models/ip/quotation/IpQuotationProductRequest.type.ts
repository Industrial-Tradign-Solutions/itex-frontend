export type IpQuotationProductRequest = {
  quotationsQuoteRequestId: string;
  quoteRequestProductId?: string;
  profitMargin: number;
  condition: 'NEW' | 'USED';
}

export function mapToIpQuotationProductRequest(form: any): IpQuotationProductRequest {
  const data = JSON.parse(JSON.stringify(form));

  return {
    quotationsQuoteRequestId: data.quotationsQuoteRequestId,
    quoteRequestProductId: data.quoteRequestProductId ?? null,
    profitMargin: data.profitMargin,
    condition: data.condition,
  };
}

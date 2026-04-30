import { IpQuoteRequestProduct } from "../quoteRequest";

export type IpQuotationProduct = {
  id: string;
  quotationsQuoteRequestId: string;
  quoteRequestProduct: IpQuoteRequestProduct;
  number: number;
  profitMargin: number;
  condition: 'NEW' | 'USED';
  sellingUnitPrice: number;
  extendedPrice: number;
  grossWeightLbs: number;
}

import { IpQuoteRequestProduct } from "../quoteRequest";

export type IpQuotationProduct = {
  id: string;
  quotationsQuoteRequestId: string;
  quoteRequestProduct: IpQuoteRequestProduct;
  number: number;
  profitMargin: number;
  condition: 'NEW' | 'USED' | 'REFURBISHED';
  sellingUnitPrice: number;
  sellingExtendedPrice: number;
  grossWeightLbs: number;
  qrNumber: string;
  supplierName: string;
}

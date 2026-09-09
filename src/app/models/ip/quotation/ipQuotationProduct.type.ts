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
  unitProfit: number | null;
  totalProfit: number | null;
  grossWeightLbs: number;
  qrNumber: string;
  supplierName: string;
}

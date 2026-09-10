import { IpQuoteRequestProduct } from "../quoteRequest";

export type IpQuotationProductCondition = 'NEW' | 'USED' | 'REFURBISH';

export type IpQuotationProduct = {
  id: string;
  quotationsQuoteRequestId: string;
  quoteRequestProduct: IpQuoteRequestProduct;
  number: number;
  profitMargin: number;
  condition: IpQuotationProductCondition;
  itsLeadTime: number;
  totalLeadTime: number;
  sellingUnitPrice: number;
  sellingExtendedPrice: number;
  unitProfit: number | null;
  totalProfit: number | null;
  grossWeightLbs: number;
  qrNumber: string;
  supplierName: string;
}

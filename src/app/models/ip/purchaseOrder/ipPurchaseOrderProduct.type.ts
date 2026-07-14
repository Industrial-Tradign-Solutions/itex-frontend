import { IpQuotationProduct } from "@interfaces/ip/quotation";

export type IpPurchaseOrderProduct = {
  id: string;
  quotationProduct: IpQuotationProduct | null;
  number: number;
}

import { IpProduct } from "../products";

export type IpQuoteRequestProduct = {
  id: string;
  ipProduct: IpProduct;
  number: number;
  quantity: number;
  unitType: string;
  leadTime: number;
  leadTimeType: 'WEEKS' | 'DAYS' | 'MONTHS';
  unitPrice: number;
  extendedPrice: number;
}

import { Client } from "@interfaces/partners/clients";

export type IpQuoteRequestAvailableForQ = {
  id: string;
  number: string;
  status: string;
  supplierName: string;
  totalProducts: number;
  subtotal: number;
  client?: Client;
  currency?: string;
  createdAt?: string;
}

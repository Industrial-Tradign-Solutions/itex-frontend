import { BasicUser } from "@interfaces/administration/user";
import { Client } from "@interfaces/partners/clients";
import { Supplier } from "@interfaces/partners/suppliers";

export type IpPurchaseOrder = {
  id: string;
  createdAt: string;
  number: string;
  name: string;
  status: string;
  currency: string;
  client: Client;
  supplier: Supplier;
  salesRep: BasicUser;
  openBy: BasicUser;
  paymentTerms: string;
  leadTime: number;
  leadTimeType: string;
  shipToName: string;
  shipToAddress: string;
  shipToCity: { id: string; name: string };
  shipToPhone: string;
  shipToContactName: string;
  shipToEmail: string;
  salesTax: number;
  openAt: string;
}

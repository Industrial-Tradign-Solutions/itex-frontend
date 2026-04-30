import { BasicUser } from "@interfaces/administration/user";
import { Client } from "@interfaces/partners/clients";
import { Supplier } from "@interfaces/partners/suppliers";

export type ListIpQuoteRequest = {
  id            : string;
  name          : string;
  client        ?: Client;
  supplier      ?: Supplier;
  status        ?: string;
  salesRep      ?: BasicUser;
  createdAt     ?: Date;
}

import { BasicUser } from "@interfaces/administration/user";
import { Client } from "@interfaces/partners/clients";

export type ListIpQuotation = {
  id            : string;
  name          : string;
  client        ?: Client;
  status        ?: string;
  salesRep      ?: BasicUser;
  applicationAt ?: Date;
  createdAt     ?: Date;
}

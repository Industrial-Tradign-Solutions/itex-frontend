import { BasicUser } from "@interfaces/administration/user";
import { Client } from "@interfaces/partners/clients";
import { Supplier } from "@interfaces/partners/suppliers";
import { IpDocumentStatus } from "../document-status.type";

export type ListIpQuoteRequest = {
  id            : string;
  name          : string;
  client        ?: Client;
  supplier      ?: Supplier;
  status        ?: IpDocumentStatus;
  salesRep      ?: BasicUser;
  createdAt     ?: Date;
}

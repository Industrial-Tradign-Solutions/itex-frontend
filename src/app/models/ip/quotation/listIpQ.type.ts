import { BasicUser } from "@interfaces/administration/user";
import { Client } from "@interfaces/partners/clients";
import { IpDocumentStatus } from "../document-status.type";

export type ListIpQuotation = {
  id            : string;
  name          : string;
  client        ?: Client;
  status        ?: IpDocumentStatus;
  salesRep      ?: BasicUser;
  applicationAt ?: string;
  createdAt     ?: Date;
}

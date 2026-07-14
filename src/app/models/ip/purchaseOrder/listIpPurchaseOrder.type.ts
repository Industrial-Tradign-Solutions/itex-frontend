import { BasicUser } from "@interfaces/administration/user";
import { ClientBasic } from "@interfaces/partners/clients";
import { IpPurchaseOrderStatus } from "./ipPurchaseOrderEnums.type";

export type ListIpPurchaseOrder = {
  id: string;
  number: string;
  name: string;
  client: ClientBasic;
  status: IpPurchaseOrderStatus;
  salesRep: BasicUser;
  createdAt: string;
}

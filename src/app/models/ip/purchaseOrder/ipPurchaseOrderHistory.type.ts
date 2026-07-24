import { IpPurchaseOrderHistoryAction } from './ipPurchaseOrderEnums.type';

export type IpPurchaseOrderHistoryResponse = {
  employee: string;
  createdAt: string;
  data: Record<string, unknown>;
  action: IpPurchaseOrderHistoryAction;
}

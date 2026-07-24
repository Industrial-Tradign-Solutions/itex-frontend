import { IpPurchaseOrderStatus, FilterDate } from './ipPurchaseOrderEnums.type';

export type IpPurchaseOrderFilter = {
  shortBy?: string;
  shortOrder?: number;

  number?: string;
  clientId?: string;
  supplierId?: string;
  remarks?: string;
  status?: IpPurchaseOrderStatus;
  clientRef?: string;
  supplierRef?: string;
  productDescription?: string;
  salesRepId?: string;
  date?: FilterDate;
  initDate?: Date;
  endDate?: Date;
}

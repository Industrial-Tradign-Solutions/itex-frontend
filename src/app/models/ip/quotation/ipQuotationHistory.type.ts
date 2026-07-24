export type IpQuotationHistoryAction =
  | 'CREATE'
  | 'UPDATE'
  | 'CLONE'
  | 'REJECTED'
  | 'STATUS_CHANGE'
  | 'ADD_PRODUCT'
  | 'REMOVE_PRODUCT'
  | 'UPDATE_PRODUCT'
  | 'ADD_QR'
  | 'REMOVE_QR'
  | 'ADD_OTHER_CHARGE'
  | 'REMOVE_OTHER_CHARGE'
  | 'UPDATE_OTHER_CHARGE';

export type IpQuotationHistoryResponse = {
  employee: string;
  createdAt: string;
  data: any;
  action: IpQuotationHistoryAction;
}

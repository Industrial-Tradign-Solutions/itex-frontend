export type IpQuoteRequestHistoryAction =
  | 'CREATE'
  | 'UPDATE'
  | 'CLONE'
  | 'REJECTED'
  | 'QUOTED'
  | 'ADD_PRODUCT'
  | 'REMOVE_PRODUCT'
  | 'UPDATE_PRODUCT'
  | 'ADD_OTHER_CHARGE'
  | 'REMOVE_OTHER_CHARGE'
  | 'UPDATE_OTHER_CHARGE';

export type IpQuoteRequestHistoryResponse = {
  employee: string;
  createdAt: string;
  data: any;
  action: IpQuoteRequestHistoryAction;
}

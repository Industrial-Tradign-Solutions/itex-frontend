export type IpPurchaseOrderStatus = 'CREATED' | 'SENT' | 'ANSWERED' | 'COMPLETE' | 'REJECTED';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'MXN';

export type PaymentTerms = 'NET_30' | 'NET_45' | 'NET_60' | 'NET_90' | 'IMMEDIATE';

export type LeadTimeType = 'DAYS' | 'WEEKS';

export type FilterDate = 'DAY' | 'MONTH' | 'YEAR' | 'ALL';

export type OpenAndLockType = 'EDIT' | 'VIEW' | 'CREATE';

export type IpPurchaseOrderHistoryAction =
  | 'CREATE'
  | 'UPDATE'
  | 'CLONE'
  | 'REJECTED'
  | 'STATUS_CHANGE'
  | 'ADD_PRODUCT'
  | 'REMOVE_PRODUCT'
  | 'UPDATE_PRODUCT'
  | 'ADD_OTHER_CHARGE'
  | 'REMOVE_OTHER_CHARGE'
  | 'UPDATE_OTHER_CHARGE'
  | 'ADD_IMPORTED_Q_CHARGE'
  | 'REMOVE_IMPORTED_Q_CHARGE'
  | 'ADD_IMPORTED_QR_CHARGE'
  | 'REMOVE_IMPORTED_QR_CHARGE';

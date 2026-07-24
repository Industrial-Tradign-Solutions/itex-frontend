export type IpPurchaseOrderStatus = 'CREATED' | 'SENT' | 'ANSWERED' | 'COMPLETE' | 'REJECTED';

// Values are driven by StaticListsService; kept as `string` so the model
// doesn't have to enumerate every backend value (Currency/PaymentTerms/LeadTimeType).
export type Currency = string;

export type PaymentTerms = string;

export type LeadTimeType = string;

export type FilterDate = 'DAY' | 'MONTH' | 'YEAR' | 'ALL';

export type OpenAndLockType = 'EDIT' | 'VIEW';

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
  | 'REMOVE_IMPORTED_QR_CHARGE'
  | 'REMOVE_QUOTATION'
  | 'CHANGE_QUOTATION';

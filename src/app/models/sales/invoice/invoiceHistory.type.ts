// §7: the 17 values of the backend `InvoiceHistoryAction` enum.
export type InvoiceHistoryAction =
  | 'CREATE'
  | 'UPDATE'
  | 'CLONE'
  | 'ISSUE'
  | 'CANCEL'
  | 'REVERT_TO_DRAFT'
  | 'ADD_PRODUCT'
  | 'REMOVE_PRODUCT'
  | 'UPDATE_PRODUCT'
  | 'ADD_CHARGE'
  | 'REMOVE_CHARGE'
  | 'UPDATE_CHARGE'
  | 'ADD_TAX'
  | 'REMOVE_TAX'
  | 'UPDATE_TAX'
  | 'REGISTER_PAYMENT'
  | 'VOID_PAYMENT';

// One row per relevant event. `data` is a dynamic JSON: a map of
// `field -> { old, new }` for the diff-style actions, or a full snapshot for
// the rest — which is why it stays untyped and the modal normalises it.
export type InvoiceHistory = {
  id: string;
  user: {
    id: string;
    fullName: string;
    user: string;
  };
  action: InvoiceHistoryAction;
  createdAt: string;
  data: Record<string, unknown>;
};

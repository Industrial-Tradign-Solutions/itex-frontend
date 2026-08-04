import { InvoiceChargeSource } from './invoiceEnums.type';

export type InvoiceCharge = {
  id: string;
  description: string;
  type: string;
  value: number;
};

// §12.1 / §12.2: `value` accepts negatives (DISCOUNT), so no min validator.
export type InvoiceChargeRequest = {
  description: string;
  type: string;
  value: number;
};

// §12.4: preview only — the rows carry no charge id because §12.3 imports the
// whole PO at once instead of a per-line selection.
export type AvailablePoCharge = {
  poId: string;
  poNumber: string;
  description: string;
  value: number;
  source: InvoiceChargeSource;
};

export type InvoiceChargeImportRequest = {
  poId: string;
};

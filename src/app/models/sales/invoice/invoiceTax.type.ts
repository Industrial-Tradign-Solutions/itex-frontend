export type InvoiceTax = {
  id: string;
  type: string;
  description: string;
  rate: number;
  taxableBase: number;
  value: number;
};

// §13: taxes are entered manually and the backend persists `rate`,
// `taxableBase` and `value` verbatim — it does not recalculate the value, so it
// travels in the request.
export type InvoiceTaxRequest = {
  type: string;
  description: string;
  rate: number;
  taxableBase: number;
  value: number;
};

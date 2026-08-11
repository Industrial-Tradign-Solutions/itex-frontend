export type InvoiceTax = {
  id: string;
  type: string;
  description: string;
  rate: number;
  taxableBase: number;
  value: number;
};

// §13: taxes are entered manually. `value` is NOT part of the request — §17
// removed it: the backend computes `value = taxableBase * rate` with BigDecimal
// (scale 5, HALF_UP) so the money arithmetic never travels over the wire. The
// response still carries the field, with the computed value.
export type InvoiceTaxRequest = {
  type: string;
  description: string;
  rate: number;
  taxableBase: number;
};

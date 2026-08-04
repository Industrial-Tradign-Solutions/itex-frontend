export type InvoiceTax = {
  id: string;
  type: string;
  description: string;
  rate: number;
  taxableBase: number;
  value: number;
};

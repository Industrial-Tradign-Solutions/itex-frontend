export type BulkProductTableItem = {
  quoteRequestProductId: string;
  quotationsQuoteRequestId: string;
  qrNumber: string;
  supplierName: string;
  ipProductId: string;

  quantity: number;
  unitType: string;
  description: string;
  clientDescription: string;
  mfrReference: string;
  clientReference: string;
  hts: string;
  dualUse: boolean;
  eccn: string;
  leadTime: number;
  leadTimeType: string;
  unitPrice: number;
  extendedPrice: number;

  selected: boolean;
  disabled: boolean;

  profitMargin: number | null;
  condition: string | null;
};

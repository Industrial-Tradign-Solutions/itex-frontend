export type InvoiceProductIp = {
  id: string;
  name: string;
  description: string;
  clientDescription: string;
  mfrReference: string;
  clientReference: string;
  brand: { id: string; name: string };
  coo: { id: string; name: string };
};

export type InvoiceProduct = {
  id: string;
  ipProduct: InvoiceProductIp;
  number: number;
  quantity: number;
  unitType: string;
  leadTime: number;
  leadTimeType: string;
  unitPrice: number;
  profitMargin: number;
  condition: string;
  extendedPrice: number;
};

// Body for the pending bulk-create endpoint (see itex-invoices-api.md §11) — deduced from InvoiceProduct.
export type InvoiceProductBulkRequest = {
  productId: string;
  quantity: number;
  unitType: string;
  leadTime: number;
  leadTimeType: string;
  unitPrice: number;
  profitMargin: number;
  condition: string;
}[];

// Body for the pending update endpoint (see itex-invoices-api.md §11).
export type InvoiceProductUpdateRequest = {
  quantity: number;
  profitMargin: number;
  condition: string;
};

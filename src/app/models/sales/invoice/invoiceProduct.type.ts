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

// §11.1 / §11.2: create and update share the same body. `profitMargin` travels
// as a fraction (0.30 = 30%); the form works in 0-100 and divides before
// sending. `number` is server-assigned.
export type InvoiceProductRequest = {
  productId: string;
  quantity: number;
  unitType: string;
  leadTime: number;
  leadTimeType: string;
  unitPrice: number;
  profitMargin: number;
  condition: string;
};

// §11.6: flat row of a linked PO's product. The backend already filters out the
// ones present in the invoice; `poProductId` is what §11.5 expects.
export type AvailablePoProduct = {
  poId: string;
  poNumber: string;
  poProductId: string;
  productId: string;
  productDescription: string;
  productMfrReference: string;
  quantity: number;
  unitType: string;
  leadTime: number;
  leadTimeType: string;
  unitPrice: number;
  profitMargin: number;
  condition: string;
};

// §11.5: one call per PO. Margin and condition are copied from the source
// Quotation, so they are not part of the request.
export type InvoiceProductImportRequest = {
  poId: string;
  poProductIds: string[];
};

export type InvoiceAssociatedPo = {
  id: string;
  number: string;
};

// §14.1: links several POs in a single call; already-linked ids are skipped
// server-side.
export type InvoicePoLinkRequest = {
  poIds: string[];
};

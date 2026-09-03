export type CreateIpQuotationRequest = {
  clientId: string;
  currency: string;
  paymentTerms: string;
  incoterms: string;
  applicationAt: string;
  observations?: string;
}

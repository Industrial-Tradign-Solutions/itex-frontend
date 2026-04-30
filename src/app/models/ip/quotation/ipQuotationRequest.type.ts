export type IpQuotationRequest = {
  currency: string;
  clientId: string;
  clientContactId: string;
  clientQrNumber: string;
  salesRepId: string;
  remarks: string;
  internalRemarks: string;
  leadTime: number;
  leadTimeType: string;
  validity: number;
  validityType: string;
  incoterms: string;
  paymentTerms: string;
}

export function mapToIpQuotationRequest(form: any): IpQuotationRequest {
  const data = JSON.parse(JSON.stringify(form));

  return {
    currency: data.currency,
    clientId: data.clientId,
    clientContactId: data.clientContactId,
    clientQrNumber: data.clientQrNumber,
    salesRepId: data.salesRepId,
    remarks: data.remarks,
    internalRemarks: data.internalRemarks,
    leadTime: data.leadTime,
    leadTimeType: data.leadTimeType,
    validity: data.validity,
    validityType: data.validityType,
    incoterms: data.incoterms,
    paymentTerms: data.paymentTerms
  };
}

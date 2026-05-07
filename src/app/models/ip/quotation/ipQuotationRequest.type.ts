export type IpQuotationRequest = {
  clientContactId?: string;
  clientQrNumber?: string;
  salesRepId?: string;
  remarks?: string;
  internalRemarks?: string;
  leadTime?: number;
  leadTimeType?: string;
  validity?: number;
  validityType?: string;
  incoterms?: string;
  paymentTerms?: string;
}

export function mapToIpQuotationRequest(form: any): IpQuotationRequest {
  const data = JSON.parse(JSON.stringify(form));

  return {
    clientContactId: data.clientContactId ?? undefined,
    clientQrNumber: data.clientQrNumber ?? undefined,
    salesRepId: data.salesRepId ?? undefined,
    remarks: data.remarks ?? undefined,
    internalRemarks: data.internalRemarks ?? undefined,
    leadTime: data.leadTime ?? undefined,
    leadTimeType: data.leadTimeType ?? undefined,
    validity: data.validity ?? undefined,
    validityType: data.validityType ?? undefined,
    incoterms: data.incoterms ?? undefined,
    paymentTerms: data.paymentTerms ?? undefined
  };
}

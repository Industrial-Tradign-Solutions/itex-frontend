export type IpQuotationRequest = {
  clientId: string;
  currency: string;
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
  applicationAt: string;
};

export function formatDateToSend(date: Date | string | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}-${day}-${year}`;
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
    paymentTerms: data.paymentTerms,
    applicationAt: data.applicationAt
  };
}

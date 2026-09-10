export type IpQuotationRequest = {
  clientId: string | null;
  currency: string | null;
  clientContactId: string | null;
  clientQrNumber: string | null;
  salesRepId: string | null;
  remarks: string | null;
  internalRemarks: string | null;
  leadTime: number | null;
  leadTimeType: string | null;
  validity: number | null;
  validityType: string | null;
  incoterms: string | null;
  paymentTerms: string | null;
  applicationAt: string | null;
  profitMarginFreightCharges: number | null;
  freightChargeMiamiITS: number | null;
};

export type IpQuotationFormValue = {
  clientId?: string | null;
  currency?: string | null;
  clientContactId?: string | null;
  clientQrNumber?: string | null;
  salesRepId?: string | null;
  remarks?: string | null;
  internalRemarks?: string | null;
  leadTime?: number | null;
  leadTimeType?: string | null;
  validity?: number | null;
  validityType?: string | null;
  incoterms?: string | null;
  paymentTerms?: string | null;
  applicationAt?: Date | string | null;
  profitMarginFreightCharges?: number | null;
  freightChargeMiamiITS?: number | null;
};

type SerializedIpQuotationForm = Omit<IpQuotationFormValue, 'applicationAt'> & {
  applicationAt?: string | null;
};

export function formatDateToSend(date: Date | string | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}-${day}-${year}`;
}

export function mapToIpQuotationRequest(form: IpQuotationFormValue): IpQuotationRequest {
  const data: SerializedIpQuotationForm = JSON.parse(JSON.stringify(form));

  return {
    currency: data.currency ?? null,
    clientId: data.clientId ?? null,
    clientContactId: data.clientContactId ?? null,
    clientQrNumber: data.clientQrNumber ?? null,
    salesRepId: data.salesRepId ?? null,
    remarks: data.remarks ?? null,
    internalRemarks: data.internalRemarks ?? null,
    leadTime: data.leadTime ?? null,
    leadTimeType: data.leadTimeType ?? null,
    validity: data.validity ?? null,
    validityType: data.validityType ?? null,
    incoterms: data.incoterms ?? null,
    paymentTerms: data.paymentTerms ?? null,
    applicationAt: data.applicationAt ?? null,
    profitMarginFreightCharges: data.profitMarginFreightCharges ?? 0,
    freightChargeMiamiITS: data.freightChargeMiamiITS ?? 0
  };
}

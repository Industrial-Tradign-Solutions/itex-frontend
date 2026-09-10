export type IpQuotationOtherChargeRequest = {
  description: string;
  value: number;
}

export type IpQuotationOtherChargeFormValue = {
  description?: string | null;
  value?: number | null;
}

export function mapToIpQOtherChargeRequest(form: IpQuotationOtherChargeFormValue): IpQuotationOtherChargeRequest {
  const data: IpQuotationOtherChargeFormValue = JSON.parse(JSON.stringify(form));
  return {
    description: data.description ?? '',
    value: data.value ?? 0
  };
}

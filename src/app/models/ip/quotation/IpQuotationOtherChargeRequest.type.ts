export type IpQuotationOtherChargeRequest = {
  description: string;
  value: number;
}

export function mapToIpQOtherChargeRequest(form: any): IpQuotationOtherChargeRequest {
  const data = JSON.parse(JSON.stringify(form));
  return {
    description: data.description,
    value: data.value
  };
}

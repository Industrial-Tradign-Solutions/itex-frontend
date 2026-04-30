export type IpQuoteRequestOtherChargeRequest = {
  description: string,
  value: number
}

export function mapToIpQrOtherChargeRequest(form: any): IpQuoteRequestOtherChargeRequest {
  const data = JSON.parse(JSON.stringify(form));
  return {
    description: data.description,
    value: data.value
  };
}

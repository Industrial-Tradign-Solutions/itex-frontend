export type IpQuoteRequestProductRequest = {
  productId: string,
  quantity: number,
  unitType: string,
  leadTime: number,
  unitPrice: number,
  leadTimeType: 'WEEKS' | 'DAYS' | 'MONTHS',
}

export function mapToIpQrProductRequest(form: any): IpQuoteRequestProductRequest {
  const data = JSON.parse(JSON.stringify(form));

  return {
    productId: data.productId,
    quantity: data.quantity,
    unitType: data.unitType,
    leadTime: data.leadTime,
    leadTimeType: data.leadTimeType,
    unitPrice: data.unitPrice
  };
}

export type IpQuoteRequestRequest = {
  currency: string;
  clientId: string;
  clientContactId: string;
  clientQrNumber: string;
  salesRepId: string;
  supplierId: string;
  supplierContactId: string;
  supplierQrNumber: string;
  remarks: string;
  internalRemarks: string;
  shippingPointZipCode: string;
  freightClass: string;
  fobShippingPoint: string;
  paymentTerms: string;
  freightCharges: number;
}

export function mapToIpQrRequest(form: any): IpQuoteRequestRequest {
  const data = JSON.parse(JSON.stringify(form));

  return {
    currency: data.currency,
    clientId: data.clientId,
    clientContactId: data.clientContactId,
    clientQrNumber: data.clientQrNumber,
    salesRepId: data.salesRepId,
    supplierId: data.supplierId,
    supplierContactId: data.supplierContactId,
    supplierQrNumber: data.supplierQrNumber,
    remarks: data.remarks,
    internalRemarks: data.internalRemarks,
    shippingPointZipCode: data.shippingPointZipCode,
    freightClass: data.freightClass,
    fobShippingPoint: data.fobShippingPoint,
    paymentTerms: data.paymentTerms,
    freightCharges: data.freightCharges
  };
}

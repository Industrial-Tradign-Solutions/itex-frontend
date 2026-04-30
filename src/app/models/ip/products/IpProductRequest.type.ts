export type IpProductsRequest = {
  brandId: string;
  description: string;
  clientDescription: string;
  mfrReference: string;
  clientReference: string;
  netWeightLbs: number;
  nmfc: number;
  freightClass: string;
  notes?: string;
  keywords?: string;
  htsScheduleBNumber: number;
  eccn: string;
  cooId: string;
  battery: boolean;
  hazmat: boolean;
  dualUse: boolean;
}

export function mapToIpProductsRequest(form: any): IpProductsRequest {
  const data = JSON.parse(JSON.stringify(form));
  return {
    brandId: data.brandId,
    description: data.description,
    clientDescription: data.clientDescription,
    mfrReference: data.mfrReference,
    clientReference: data.clientReference,
    netWeightLbs: data.netWeightLbs,
    nmfc: data.nmfc,
    freightClass: data.freightClass,
    notes: data.notes,
    keywords: data.keywords,
    htsScheduleBNumber: data.htsScheduleBNumber,
    eccn: data.eccn,
    cooId: data.cooId,
    battery: data.battery,
    hazmat: data.hazmat,
    dualUse: data.dualUse
  };
}

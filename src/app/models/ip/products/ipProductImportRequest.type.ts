import { BasicBrand } from "@interfaces/masters/brands";
import { BasicCountry } from "@interfaces/masters/locations/countries";

export type IpImportProductsValidateRequest = {
  brandStr: string;
  description: string;
  clientDescription: string;
  mfrReference: string;
  clientReference: string;
  netWeightLbs: number;
  nmfc: number;
  freightClass: string;
  htsScheduleBNumber: number;
  eccn: string;
  cooStr: string;
  battery: boolean;
  hazmat: boolean;
  dualUse: boolean;
}

export type IpImportProductsResponse = {
  brand: BasicBrand;
  description: string;
  clientDescription: string;
  mfrReference: string;
  clientReference: string;
  netWeightLbs: number;
  nmfc: number;
  freightClass: string;
  htsScheduleBNumber: number;
  eccn: string;
  coo: BasicCountry;
  battery: boolean;
  hazmat: boolean;
  dualUse: boolean;
  importErrors: string[]
  validImport: boolean;
  saveBrand: boolean;
  saveCoo: boolean;
}

export type IpImportProductsRequest = {
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
  validImport: boolean;
  saveBrand: boolean;
  saveCoo: boolean;
}

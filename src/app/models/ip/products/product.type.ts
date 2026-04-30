import { BasicUser } from "@interfaces/administration/user";
import { BasicBrand } from "@interfaces/masters/brands";
import { BasicCountry } from "@interfaces/masters/locations/countries";
import { IpProductSurplus } from "./ipProductSurplus.type";

export type IpProduct = {
  id : string;
  name: string;
  brand: BasicBrand;
  description: string;
  clientDescription: string;
  mfrReference: string;
  clientReference: string;
  netWeightLbs: number;
  nmfc: number;
  freightClass: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUBSTITUTED';
  notes: string;
  keywords: string;
  htsScheduleBNumber: number;
  eccn: string;
  coo: BasicCountry;

  battery: boolean;
  hazmat: boolean;
  dualUse: boolean;
  substituteProduct: IpProduct;

  surplus: any[];
  totalSurplus: number;
  surplusLocation: IpProductSurplus;

  openBy: BasicUser;
  openAt: Date;
  createdAt: Date;
}

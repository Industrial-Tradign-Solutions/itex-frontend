import { BasicBrand } from "@interfaces/masters/brands";

export type ListIpProduct = {
  id            : string;
  name          : string;
  description   : string;
  brand        ?: BasicBrand;
  freightClass ?: string;
  status       ?: string;
  nmfc         ?: number;
  mfrReference ?: string;
  clientReference ?: string;
  createdAt    ?: Date;
}

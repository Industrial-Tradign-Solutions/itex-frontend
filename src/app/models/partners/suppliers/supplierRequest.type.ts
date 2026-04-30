import { SupplierInfoDepRequest } from "./supplierInfoDepRequest.type";

export type SupplierRequest = {
  name: string;
  taxId?: number;
  status: string;
  language: string;
  paymentMethod: string;
  paymentTerms?: string;
  address?: string;
  cityId?: string;
  zipCode?: string;
  notes?: string;
  wireAchInstructions?: string;
  industryId?: string;
  webSite?: string;
  countryCode?: number;
  cityCode?: number;
  phoneNumber?: number;
  infoByDepartment: SupplierInfoDepRequest[];
}

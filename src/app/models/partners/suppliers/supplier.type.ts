import { BasicCity } from "@interfaces/masters/locations/cities";
import { SupplierInfoDep } from "./supplierInfoDep.type";
import { BasicUser } from "@interfaces/administration/user";

export type Supplier = {
  id : string;
  name: string;
  taxId: string;
  status: string;
  language: string;
  paymentMethod: string;
  paymentTerms: string;
  address: string;
  city: BasicCity;
  zipCode: string;
  notes: string;
  wireAchInstructions: string;
  webSite: string;
  countryCode: string;
  cityCode: string;
  phoneNumber: string;
  infoByDepartment: SupplierInfoDep[];
  updatedBy: BasicUser;
  updatedAt: Date;
  createdBy: BasicUser;
  createdAt: Date;
  openBy: BasicUser;
  openAt: Date;
}

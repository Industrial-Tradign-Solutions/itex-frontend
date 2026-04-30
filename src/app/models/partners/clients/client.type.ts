import { BasicIndustry } from "@interfaces/masters/industries";
import { BasicCity } from "@interfaces/masters/locations/cities";
import { ClientInfoDep } from "./clientInfoDep.type";
import { BasicUser } from "@interfaces/administration/user";

export type Client = {
  id : string;
  code: string;
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
  industry: BasicIndustry;
  webSite: string;
  countryCode: string;
  cityCode: string;
  phoneNumber: string;
  infoByDepartment: ClientInfoDep[];
  updatedBy: BasicUser;
  updatedAt: Date;
  createdBy: BasicUser;
  createdAt: Date;
  openBy: BasicUser;
  openAt: Date;
  changeProspectToClientBy: BasicUser;
  changeProspectToClientAt: Date;
}

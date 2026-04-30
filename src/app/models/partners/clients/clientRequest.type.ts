import { ClientInfoDepRequest } from "./clientInfoDepRequest.type";

export type ClientRequest = {
  code: string;
  name: string;
  taxId?: string;
  status: string;
  language: string;
  paymentMethod: string;
  paymentTerms?: string;
  address?: string;
  cityId?: string;
  zipCode?: string;
  notes?: string;
  industryId?: string;
  webSite?: string;
  countryCode?: number;
  cityCode?: number;
  phoneNumber?: number;
  infoByDepartment: ClientInfoDepRequest[];
}

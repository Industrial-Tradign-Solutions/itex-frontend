import { ClientInfoDep } from "./clientInfoDep.type";

export type ClientBasic = {
  id : string;
  name: string;
  code: string;
  address: string;
  showName: string;
  paymentTerms: string;
  infoByDepartment: ClientInfoDep[];
}

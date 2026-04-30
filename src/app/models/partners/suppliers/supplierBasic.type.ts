import { SupplierInfoDep } from "./supplierInfoDep.type";

export type SupplierBasic = {
  id : string;
  name: string;
  address: string;
  paymentTerms: string;
  infoByDepartment: SupplierInfoDep[];
}

import { BasicDepartment } from "@interfaces/masters/departments";
import { SupplierContact } from "./supplierContact.type";

export type SupplierInfoDep = {
  id: string;
  department: BasicDepartment;
  listContacts: SupplierContact[];
  notes: string;
}

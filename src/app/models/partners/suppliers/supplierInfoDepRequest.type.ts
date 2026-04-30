import { SupplierContactRequest } from "./supplierContactRequest.type";

export type SupplierInfoDepRequest = {
  id?: string;
  departmentId: string;
  listContacts: SupplierContactRequest[];
  notes?: string;
}

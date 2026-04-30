import { SupplierContactPhoneRequest } from "./supplierContactPhoneReques.type";

export type SupplierContactRequest = {
  id?: string;
  name: string;
  title: string;
  email: string;
  validMain: boolean;
  listPhones: SupplierContactPhoneRequest[];
}

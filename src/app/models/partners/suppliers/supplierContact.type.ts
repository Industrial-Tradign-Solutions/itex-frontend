import { SupplierContactPhone } from "./supplierContactPhone.type";

export type SupplierContact = {
  id: string;
  name: string;
  title: string;
  email: string;
  validMain: boolean;
  active: boolean;
  listPhones: SupplierContactPhone[];
  mainPhone: string;
}

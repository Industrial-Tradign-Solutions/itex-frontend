import { SupplierBasic } from "@interfaces/partners/suppliers";

export type AvailableForPurchaseOrder = {
  id: string;
  number: string;
  name: string;
  status: string;
  applicationAt?: string;
  suppliers: SupplierBasic[];
}

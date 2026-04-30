import { BasicUser } from "@interfaces/administration/user";
import { Client, ClientContact } from "@interfaces/partners/clients";
import { Supplier, SupplierContact } from "@interfaces/partners/suppliers";
import { IpQuoteRequestProduct } from "./ipQuoteRequestProduct.type";
import { ListIpQuoteRequest } from "./listIpQr.type";
import { IpQuoteRequestOtherCharges } from "./ipQuoteRequestOtherCharges.type";

export type IpQuoteRequest = {
  id: string;
  createdAt: string;
  number: string;
  status: string;
  currency: string;
  client: Client;
  clientContact: ClientContact;
  clientQrNumber: string;
  salesRep: BasicUser;
  supplier: Supplier;
  supplierContact: SupplierContact;
  supplierQrNumber: string;
  remarks: string;
  internalRemarks: string;
  shippingPointZipCode: string;
  freightClass: string;
  fobShippingPoint: string;
  paymentTerms: string;
  freightCharges: number;
  openAt: string;
  openBy: BasicUser;
  products: IpQuoteRequestProduct[];
  otherCharges: IpQuoteRequestOtherCharges[];
  subTotal: number;
  total: number;
  clonedByQr?: IpQuoteRequest;
  clonedQrs: ListIpQuoteRequest[];
  name: string;
  totalOtherCharges: number;
  grossWeightLbs: number;

  listQuotations: any[];

  sentAt: string;
  answeredAt: string;
  completeAt: string;
  rejectAt: string;
}

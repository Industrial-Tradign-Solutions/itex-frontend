import { BasicUser } from "@interfaces/administration/user";
import { Client, ClientContact } from "@interfaces/partners/clients";
import { IpQuotationProduct } from "./ipQuotationProduct.type";
import { IpQuotationOtherCharge } from "./IpQuotationOtherCharge.type";

export type IpQuotation = {
  id: string;
  number: string;
  name: string;
  status: string;
  currency: string;
  client: Client;
  clientContact: ClientContact;
  clientQNumber: string;
  salesRep: BasicUser;
  remarks: string;
  internalRemarks: string;
  leadTime: number;
  leadTimeType: string;
  validity: number;
  validityType: string;
  incoterms: string;
  paymentTerms: string;
  applicationAt: string;
  pdfUrl: string;
  openBy: BasicUser;
  openAt: string;
  listQuoteRequests: {qqrId?: string, id?: string, number?: string}[];
  products: IpQuotationProduct[];
  otherCharges: IpQuotationOtherCharge[];
  clonedQuotations?: { id: string; number: string }[];
  listPurchaseOrders?: { id: string; number: string }[];
  grossWeightLbs?: number;
  subTotal?: number;
  freightCharges?: number;
  totalOtherCharges?: number;
  total?: number;

  createdAt: string;
  sentAt: string;
  answeredAt: string;
  completeAt: string;
  rejectAt: string;

}

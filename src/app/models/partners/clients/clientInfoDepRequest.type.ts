import { ClientContactRequest } from "./clientContactRequest.type";

export type ClientInfoDepRequest = {
  id?: string;
  accountRepId?: string;
  departmentId: string;
  target: number;
  listContacts: ClientContactRequest[];
  notes?: string;
}

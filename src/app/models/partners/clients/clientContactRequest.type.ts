import { ClientContactPhoneRequest } from "./clientContactPhoneReques.type";

export type ClientContactRequest = {
  id?: string;
  name: string;
  title: string;
  email: string;
  validMain: boolean;
  listPhones: ClientContactPhoneRequest[];
}

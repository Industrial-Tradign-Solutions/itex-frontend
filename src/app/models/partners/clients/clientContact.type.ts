import { ClientContactPhone } from "./clientContactPhone.type";

export type ClientContact = {
  id: string;
  name: string;
  title: string;
  email: string;
  validMain: boolean;
  active: boolean;
  listPhones: ClientContactPhone[];
  mainPhone: string;
}

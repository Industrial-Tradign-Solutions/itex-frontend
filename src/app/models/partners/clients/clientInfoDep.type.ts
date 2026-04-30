import { BasicUser } from "@interfaces/administration/user";
import { BasicDepartment } from "@interfaces/masters/departments";
import { ClientContact } from "./clientContact.type";

export type ClientInfoDep = {
  id: string;
  accountRep: BasicUser;
  department: BasicDepartment;
  target: number;
  listContacts: ClientContact[];
  notes: string;
}

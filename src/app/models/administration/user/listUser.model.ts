import { BasicDepartment } from "@interfaces/masters/departments";
import { BasicRole } from "../roles";

export interface ListUser {
  id:                  string;
  name:                string;
  lastName:            string;
  email:               string;
  active:              boolean;
  passChanged:         boolean;
  role:                BasicRole;
  departments:          BasicDepartment[];
  createdAt:           Date;
  title:               string;
  extension:           string;
  user:                string;
}

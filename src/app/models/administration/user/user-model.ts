import { BasicDepartment } from "@interfaces/masters/departments";
import { BasicRole } from "../roles";

export interface User {
  id:                  string;
  name:                string;
  lastName:            string;
  email:               string;
  active:              boolean;
  passChanged:         boolean;
  passChangedAt:       Date;
  role:                BasicRole;
  departments:         BasicDepartment[];
  emailPassword:       string;
  createdAt:           Date;
  title:               string;
  extension:           string;
  user:                string;
}

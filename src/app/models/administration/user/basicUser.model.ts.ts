import { BasicDepartment } from "@interfaces/masters/departments";
import { BasicRole } from "../roles/roleBasic-model";

export interface BasicUser {
  id:         string;
  fullName:   string;
  role:       BasicRole;
  departments: BasicDepartment[];
  active:     boolean;
}


import { BasicDepartment } from "./basicDepartment.model";

export interface ListsDepartments {
  enables: BasicDepartment[],
  disables: BasicDepartment[]
}

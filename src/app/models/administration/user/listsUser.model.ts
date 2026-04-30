import { BasicUser } from "./basicUser.model.ts";

export interface ListsUser {
  enableUsers: BasicUser[];
  disableUsers: BasicUser[];
}

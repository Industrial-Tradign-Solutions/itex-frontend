import { Injectable, Signal } from "@angular/core";
import { storageKeys } from "../../../environments";
import { environment } from "../../../environments/environment";
import { catchError, Observable, throwError } from "rxjs";
import { MessageResponse } from "@interfaces/message-response";
import { BaseService } from "../base-service.service";
import { BasicUser, ListsUser, ListUser, User, UserRequest } from "@interfaces/administration/user";



const URL_SERVICES = environment.api_url + 'admin/users';
const LIST_USERS_KEY = storageKeys.lists.list_users;

@Injectable({
  providedIn: 'root'
})
export class UsersService extends BaseService<User, UserRequest, ListUser, BasicUser, ListsUser> {

  constructor() {
    super(URL_SERVICES, LIST_USERS_KEY);
  }

  resetUserPass(user: User): Observable<MessageResponse<number>> {
    const url  = `${ URL_SERVICES }/reset-password/${user.id}`;
    return this.http.put<MessageResponse<number>>( url, {}, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  closeAllSessions(minutes: number): Observable<MessageResponse<string>> {
    const url  = `${ URL_SERVICES }/close-all-sessions/${minutes}`;
    return this.http.delete<MessageResponse<string>>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  loadEmployees(addDisables: boolean, disableEmployee?: BasicUser | BasicUser[]): void {
    this.loadList(addDisables, this.getListBasicUsers.bind(this), disableEmployee);
  }

  get listEmployees(): Signal<BasicUser[]> {
    return this.list;
  }

  get filteredEmployees(): BasicUser[] {
    return this.filteredList;
  }

  changeUserPassword(userId: string, data: any): Promise<MessageResponse<any>> {
    return new Promise((resolve, reject) => {
      const headers = this.authSV.headers();
      this.http
        .put(`${URL_SERVICES}/change-password/${userId}`, data, {headers})
        .subscribe({
          next: (resp: any) => {
            resolve(resp);
          },
          error: err => {
            reject(err.error);
          }
        });
    });
  }

  getProfilePhoto(userId: string): Observable<Blob> {
    const url  = `${ URL_SERVICES }/${userId}/photo-profile`;
    return this.http.get( url, {headers: this.authSV.headersBlob(), responseType: 'blob'} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  private getListBasicUsers(lists: ListsUser, addDisables: boolean): BasicUser[] {
    let list = lists.enableUsers;
    if (addDisables){
      list = [...lists.enableUsers, ...lists.disableUsers]
    }
    return list;
  }
}


import { Injectable, Signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { storageKeys } from '../../../environments/storage-keys';
import { BasicRole, ListsRoles, Role, RoleRequest } from '@interfaces/administration/roles';
import { BaseService } from '@services/base-service.service';
import { ActionType, MenuItemType } from '@config/types/menu';


const URL_SERVICES = environment.api_url + 'admin/roles';
const LIST_ROLES_KEY = storageKeys.lists.list_roles;

@Injectable({
  providedIn: 'root'
})
export class RolesService extends BaseService<Role, RoleRequest, Role, BasicRole, ListsRoles > {

  constructor() {
    super(URL_SERVICES, LIST_ROLES_KEY);
  }

  async getListMenusByIdRole(roleId: string): Promise<{unassignedMenus:MenuItemType[], assignedMenus:MenuItemType[] }> {
    return new Promise((resolve, reject) => {
      try {
        const headers = this.authSV.headers();
        this.http.get<any>(`${URL_SERVICES}/menu/${roleId}`, {headers}).subscribe({
          next: resp => {
            resolve(resp);
          }, error: err => {
            reject(err.error);
          }
        });
      } catch(err) {
        reject(err);
      }
    });
  }
  async updateListMenusByIdRole(roleId: string, data: any): Promise<MenuItemType[]> {
    return new Promise((resolve, reject) => {
      try {
        const headers = this.authSV.headers();
        this.http.put<MenuItemType[]>(`${URL_SERVICES}/menu/${roleId}`, data, {headers}).subscribe({
          next: resp => {
            resolve(resp);
          }, error: err => {
            reject(err.error);
          }
        });
      } catch(err) {
        reject(err);
      }
    });
  }

  async getListActionsByIdRole(roleId: string): Promise<{unassignedActions:ActionType[], assignedActions:ActionType[] }> {
    return new Promise((resolve, reject) => {
      try {
        const headers = this.authSV.headers();
        this.http.get<any>(`${URL_SERVICES}/action/${roleId}`, {headers}).subscribe({
          next: resp => {
            resolve(resp);
          }, error: err => {
            reject(err.error);
          }
        });
      } catch(err) {
        reject(err);
      }
    });
  }

  async updateListActionsByIdRole(roleId: string, data: any): Promise<ActionType[]> {
    return new Promise((resolve, reject) => {
      try {
        const headers = this.authSV.headers();
        this.http.put<ActionType[]>(`${URL_SERVICES}/action/${roleId}`, data, {headers}).subscribe({
          next: resp => {
            resolve(resp);
          }, error: err => {
            reject(err.error);
          }
        });
      } catch(err) {
        reject(err);
      }
    });
  }

  loadRoles(addDisables: boolean, disableItems?: BasicRole | BasicRole[]): void {
    this.loadList(addDisables, this.getListBasicRoles.bind(this), disableItems);
  }

  get listRoles(): Signal<BasicRole[]> {
    return this.list;
  }

  get filteredRoles(): BasicRole[] {
    return this.filteredList;
  }

  private getListBasicRoles(lists: ListsRoles, addDisables: boolean): BasicRole[] {
    let list = lists.enables;
    if (addDisables){
      list = [...lists.enables, ...lists.disables]
    }
    return list;
  }

}



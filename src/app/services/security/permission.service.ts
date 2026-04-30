import { Injectable } from '@angular/core';
import { AuthService } from '../security/auth.service';
import { HttpClient } from '@angular/common/http';
import { StorageService } from '../util/storage.service';
import { BehaviorSubject, filter, from, Observable, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { storageKeys } from '../../../environments/storage-keys';
import { UserInfo } from '@interfaces/administration/user';
import { MainMenuType } from '@config/types/menu';

const URL_SERVICES = environment.api_url + 'admin/roles/';
const USER_INFO_KEY = storageKeys.user_data;
const URL_NAVIGATE_CONFIG = storageKeys.config.urlNavigate;

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  private actionIdList: number[] = [];
  private menuIdList: number[] = [];

  private storageReady = new BehaviorSubject(false);

  constructor(
    private authSV: AuthService,
    private http: HttpClient,
    private storageSV: StorageService
  ) {
    this.init();
  }

  private async init() {
    const menuId = await this.storageSV.get(USER_INFO_KEY.menu_list);
    this.menuIdList = menuId ? menuId : [];

    const actionId = await this.storageSV.get(USER_INFO_KEY.actions_list);
    this.actionIdList = actionId ? actionId : [];
    this.storageReady.next(true);
  }

  async listMenuItems(): Promise<any[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const menuItems: any[] = await this.storageSV.get(USER_INFO_KEY.menu_options);
        if (menuItems && menuItems.length > 0)  {
          resolve(menuItems);
        } else {
          const headers = this.authSV.headers();
          const userData: UserInfo = await this.storageSV.get(USER_INFO_KEY.info);
          this.http
          .get<MainMenuType[]>(`${URL_SERVICES}menu/list-menus/${userData.roleId}`, {headers})
          .subscribe(
            {
              next: resp => {
                if (resp && resp.length > 0) {
                    let items: any[] = [];
                    resp.forEach(item => {
                      let menuItems: any  = [];
                      item.items.forEach(menuItem => {
                        menuItems.push(
                          {
                            label: menuItem.name,
                            icon: `pi pi-fw ${menuItem.icon}`,
                            routerLink: [menuItem.url],
                            description: menuItem.description,
                            docsUrl: menuItem.docsUrl
                          }
                        );
                      });
                      items.push(
                        {
                          label: item.name,
                          icon: item.icon,
                          items: menuItems
                        }
                      );
                    });
                    this.storageSV.set(USER_INFO_KEY.menu_options, items);
                    resolve(items);
                } else {
                  resolve([]);
                }
              },
              error: err => reject(err)
            }
          );
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  async loadUserActions() {
    const headers = this.authSV.headers();
    const userData: UserInfo = await this.storageSV.get(USER_INFO_KEY.info);
    this.http
      .get<any>(`${URL_SERVICES}action/list-id/${userData.roleId}`, {headers})
      .subscribe({
        next: resp => {
          if (resp) {
            this.storageSV.set(USER_INFO_KEY.actions_list, resp.actionIds);
            this.actionIdList = resp.actionIds;
            return;
          }
        }
    });
  }

  async loadUserMenus() {
    const headers = this.authSV.headers();
    const userData: UserInfo = await this.storageSV.get(USER_INFO_KEY.info);
    this.http
      .get<any>(`${URL_SERVICES}menu/list-id/${userData.roleId}`, {headers})
      .subscribe({
        next: resp => {
          if (resp) {
            this.storageSV.set(USER_INFO_KEY.menu_list, resp.menuIds);
            this.menuIdList = resp.menuIds;
            return;
          }
        }
      });
  }

  isValidMenu(idMenu: number, route: string): Observable<boolean> {
    return this.isValidMenuAction(idMenu).pipe(
      tap(resp => {
        if (!resp) {
          this.storageSV.set(URL_NAVIGATE_CONFIG, route);
          this.authSV.router.navigateByUrl('/p/not-found', {replaceUrl: true});
        }
      })
    );
  }

  private isValidMenuAction(idMenu: number) {
    return this.storageReady.pipe(
      filter(ready => ready),
      switchMap( () => {
        return from(Promise.resolve(this.menuIdList.includes(idMenu)));
      }) || of(false)
    );
  }

  async isValidAction(idAction: number): Promise<boolean> {
    return new Promise(resolve => {
      this.isValidActionAction(idAction).subscribe({next: (resp) => {
        resolve(resp);
      }})
    });
  }

  private isValidActionAction(idAction: number) {
    return this.storageReady.pipe(
      filter(ready => ready),
      switchMap( () => {
        return from(Promise.resolve(this.actionIdList.includes(idAction)));
      }) || of(false)
    );
  }
}

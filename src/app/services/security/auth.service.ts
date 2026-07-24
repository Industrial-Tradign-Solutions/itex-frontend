import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { storageKeys } from '../../../environments/storage-keys';
import { environment } from '../../../environments/environment';
import { StorageService } from '@services/util';
import { catchError, Observable, throwError } from 'rxjs';
import { Messages } from '@config/messages';
import { LoginType } from '@config/types/auth';
import { NameModules } from '@config/types/tabs';

const USER_DATA_KEYS = storageKeys.user_data;
const JWT_HELPER = new JwtHelperService();
const API_URL = environment.api_url;
const URL_NAVIGATE_CONFIG = storageKeys.config.urlNavigate;
const MESSAGES = Messages.config.auth;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private token = '';

  private _headers = signal<HttpHeaders | undefined>(undefined);
  private _headersMultipart = signal<HttpHeaders | undefined>(undefined);
  private _headersBlob = signal<HttpHeaders | undefined>(undefined);

  headers = computed<HttpHeaders | undefined>(() => this._headers());
  headersMultipart = computed<HttpHeaders | undefined>(() => this._headersMultipart());
  headersBlob = computed<HttpHeaders | undefined>(() => this._headersBlob());

  constructor(
    private http: HttpClient,
    public router: Router,
    private storageSV: StorageService
  ) {
    this.init();
  }

  private init() {
    this.getToken().then(token => {
      this.token = token;
      if (JWT_HELPER.isTokenExpired(this.token)) {
        this.logoutAction();
      } else {
        this.setHeaders(token);
        this.listenForLogout();
      }
    });
  }

  private listenForLogout() {
    window.addEventListener('storage', (event) => {
      if (event.key === 'LOGOUT') {
        window.close();
      } else if (event.key === 'WEB_TOKEN') {
        window.location.reload();
      }
    });
  }

  async isAuthenticated(route?: string) {
    return await this.isAuthAction(route);
  }

  async isNotAuthenticated() {
    return await this.isNotAuthAction();
  }

  async getToken(): Promise<string> {
    if (this.token === '') {
      try {
        let loadToken: string = await this.storageSV.get(USER_DATA_KEYS.token);
        this.token = loadToken ? loadToken : '';
      } catch (err) {
        console.error(err);
        this.logoutAction();
      }
    }
    return this.token;
  }

  async logoutAction(route?: string) {
    this.deleteStorageUser();
    this.setHeaders(null);
    if (route) {
      this.storageSV.set(URL_NAVIGATE_CONFIG, route);
    } else {
      this.storageSV.delete(URL_NAVIGATE_CONFIG);
    }
    this.router.navigateByUrl('/login', {replaceUrl: true});
    localStorage.setItem('LOGOUT', Date.now().toString());
  }

  private setHeaders(token: string | null) {
    if (token === null) {
      this._headers.set(undefined);
      this._headersMultipart.set(undefined);
      this._headersBlob.set(undefined);
    } else {
      this._headers.set(new HttpHeaders({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        })
      );
      this._headersMultipart.set(new HttpHeaders({
          'Authorization': 'Bearer ' + token
        })
      );
      this._headersBlob.set(new HttpHeaders({
          'Content-Type': 'application/json',
          'Accept': 'application/pdf, application/octet-stream, application/json, image/avif, image/jpeg, image/png',
          'Authorization': 'Bearer ' + token
        })
      );
    }
  }


  logoutBackendAction(): Observable<void> {
    return this.http.delete<void>( `${API_URL}action/logout`, {headers: this.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  async isTokenExpired() {
    const token = await this.getToken();
    return JWT_HELPER.isTokenExpired(token);
  }

  async login(form: LoginType): Promise<boolean> {
    return new Promise((resolve, reject) => {
      form.username = form.username.toLowerCase();
      this.http.post(`${API_URL}login`, form).subscribe(
        {
          next: (resp: any) => {
            if (resp && resp.token) {
              this.storageSV.set(USER_DATA_KEYS.token, resp.token);
              delete resp.token;
              this.storageSV.set(USER_DATA_KEYS.info, resp);
              this.init();
              resolve(true);
            } else {
              reject(
                {
                  errorMessage: MESSAGES.error_server,
                  statusCode: 0
                }
              );
            }
          }, error: err => {
            if (err.status === 0) {
              reject({
                errorMessage: MESSAGES.problems,
                statusCode: 0
              });
            } else {
              reject(err.error);
            }
          }
        }
      );
    });
  }

  private isAuthAction(route?: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      const token = await this.getToken();
      if (token && token !== '') {
        if (JWT_HELPER.isTokenExpired(token)) {
          this.logoutAction(route);
          resolve(false);
        } else {
          resolve(true);
        }
      } else {
        this.logoutAction(route);
        resolve(false);
      }
    });
  }

  private isNotAuthAction(): Promise<boolean> {
    return new Promise(async (resolve) => {
      const token = await this.getToken();
      if (!token || token === '') {
        this.deleteStorageUser();
        resolve(true);
      } else {
        if (JWT_HELPER.isTokenExpired(token)) {
          this.deleteStorageUser();
          resolve(true);
        } else {
          this.router.navigateByUrl('/p', {replaceUrl: true});
          resolve(false);
        }
      }
    });
  }

  private deleteStorageUser() {
    this.storageSV.delete(USER_DATA_KEYS.token);
    this.storageSV.delete(USER_DATA_KEYS.actions_list);
    this.storageSV.delete(USER_DATA_KEYS.info);
    this.storageSV.delete(USER_DATA_KEYS.menu_list);
    this.storageSV.delete(USER_DATA_KEYS.menu_options);

    const lists: string[] = Object.values(storageKeys.lists);
    lists.forEach(list => {
      this.storageSV.delete(list);
    });

    const listsStatics: string[] = Object.values(storageKeys.static_lists);
    listsStatics.forEach(list => {
      this.storageSV.delete(list);
    });
    this.token = '';

    this.listModules().forEach(module => {
      this.storageSV.delete(`${storageKeys.tabs.TABS_STORAGE_MODULE_NAME}-${module}`);
    });
  }

  private listModules(): NameModules[] {
    return [
      'Clients',
      'Departments',
      'Roles',
      'Suppliers',
      'Users',
      'Locations',
      'Industries',
      'Dashboard',
      'Brands',
      'Products',
      'Quote_Requests',
      'Quotations',
      'Purchase_Orders'
    ];
  }
}

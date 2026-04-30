import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '@services/security';
import { catchError, concatMap, Observable, of, Subject, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MessageResponse } from '@interfaces/message-response';
import { Client, ClientBasic, ClientFilter, ClientRequest, ListClients } from '@interfaces/partners/clients';
import { Page } from '@interfaces/page.model';
import { ClientDashboardType } from '../../models/partners/clients/clientDashboard.type';
import { TypeTab } from '@config/types/tabs';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';

const URL_SERVICES = environment.api_url + 'partners/clients';

@Injectable({
  providedIn: 'root'
})
export class ClientsService {

  //! Inyecciones
  private authSV     = inject(AuthService);
  private http       = inject(HttpClient);
  //!---------------------------------------

  private _list = signal<ClientBasic[]>([]);
  list = computed<ClientBasic[]>(() => this._list());
  filteredList: ClientBasic[] = [];

  private openAndLockRequestQueue = new Subject<{ clientId: string, type: TypeTab, observer: any }>();

  constructor() {
    this.openAndLockProcessQueue();
  }

  loadAllBasic(): void {
    let url  = `${ URL_SERVICES }/list-active`;
    this.http.get<ClientBasic[]>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      )
      .subscribe({
        next: resp => {
          this._list.set(resp);
        }
      });
  }

  searchAutoComplete(event: AutoCompleteCompleteEvent) {
    let filtered: ClientBasic[] = [];
    let query = event.query;

    for (let i = 0; i < (this.list() as ClientBasic[]).length; i++) {
      let item = (this.list() as ClientBasic[])[i];
      if (item.name.toLowerCase().indexOf(query.toLowerCase()) == 0 || item.code.indexOf(query.toUpperCase()) == 0) {
        filtered.push(item);
      }
    }

    this.filteredList = filtered;
  }

  listAllClientsPage(filter: ClientFilter, page: number, size: number): Observable<Page<ListClients>> {
    let url  = `${ URL_SERVICES }?page=${page}&size=${size}`;

    if (filter.name)
      url = `${url}&name=${filter.name}`;

    if (filter.cityId)
      url = `${url}&cityId=${filter.cityId}`;

    if (filter.status)
      url = `${url}&status=${filter.status}`;

    if (filter.code)
      url = `${url}&code=${filter.code}`;

    if (filter.taxId)
      url = `${url}&taxId=${filter.taxId}`;

    if (filter.notes)
      url = `${url}&notes=${filter.notes}`;

    if (filter.shortBy)
      url = `${url}&shortBy=${filter.shortBy}`;

    if (filter.shortOrder)
      url = `${url}&shortOrder=${filter.shortOrder}`;

    if (filter.countryId)
      url = `${url}&countryId=${filter.countryId}`;

    return this.http.get<Page<ListClients>>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  private openAndLockProcessQueue() {
    this.openAndLockRequestQueue.pipe(
      concatMap(({ clientId, type, observer }) =>
        this.http.get<{data: Client, isValidOpen: boolean}>(`${URL_SERVICES}/open-and-lock/${clientId}?type=${type.toUpperCase()}`, {headers: this.authSV.headers()}).pipe(
          catchError(err => {
            observer.error(err.error.errorMessage);
            return of(null);
          })
        ).pipe(
          concatMap(response => {
            observer.next(response);
            observer.complete();
            return of(response);
          })
        )
      )
    ).subscribe();
  }

  openAndLockClient(clientId: string, type: TypeTab): Observable<{data: Client, isValidOpen: boolean}> {
    return new Observable(observer => {
      this.openAndLockRequestQueue.next({ clientId, type, observer });
    });
  }

  /**
   * @deprecated Esta función será eliminada en futuras versiones. Utiliza la función nuevaFunction() en su lugar.
  */
  dashboard(): Observable<ClientDashboardType> {
    let url  = `${ URL_SERVICES }/dashboard`;
    return this.http.get<ClientDashboardType>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  loadOpenClients(): Observable<ListClients[]> {
    let url  = `${ URL_SERVICES }/load-open-clients`;
    return this.http.get<ListClients[]>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  closeListClients(listIds: string[]): Observable<MessageResponse<string[]>> {
    let url  = `${ URL_SERVICES }/close-list-clients`;
    return this.http.put<MessageResponse<string[]>>( url, listIds, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  closeClient(id: string): Observable<MessageResponse<string>> {
    let url  = `${ URL_SERVICES }/close-client/${id}`;
    return this.http.put<MessageResponse<string>>( url, {}, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  create(request: ClientRequest): Observable<MessageResponse<Client>> {
    const url  = `${ URL_SERVICES }/create`;
    return this.http.post<MessageResponse<Client>>( url, request, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error ))
      );
  }

  update(id: string, request: ClientRequest): Observable<MessageResponse<Client>> {
    const url  = `${ URL_SERVICES }/update/${id}`;
    return this.http.put<MessageResponse<Client>>( url, request, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error ))
      );
  }
}

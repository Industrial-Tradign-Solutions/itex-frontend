import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '@services/security';
import { catchError, concatMap, Observable, of, Subject, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ListSuppliers, Supplier, SupplierBasic, SupplierFilter, SupplierRequest } from '@interfaces/partners/suppliers';
import { Page } from '@interfaces/page.model';
import { MessageResponse } from '@interfaces/message-response';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { TypeTab } from '@config/types/tabs';

const URL_SERVICES = environment.api_url + 'partners/suppliers';

@Injectable({
  providedIn: 'root'
})
export class SuppliersService {

  //! Inyecciones
  private authSV     = inject(AuthService);
  private http       = inject(HttpClient);
  //!---------------------------------------

  private _list = signal<SupplierBasic[]>([]);
  list = computed<SupplierBasic[]>(() => this._list());
  filteredList: SupplierBasic[] = [];

  private openAndLockRequestQueue = new Subject<{ supplierId: string, type: TypeTab, observer: any }>();

  constructor() {
    this.openAndLockProcessQueue();
  }

  loadAllBasic(): void {
    let url  = `${ URL_SERVICES }/list-active`;
    this.http.get<SupplierBasic[]>( url, {headers: this.authSV.headers()} )
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
    let filtered: SupplierBasic[] = [];
    let query = event.query;

    for (let i = 0; i < (this.list() as any[]).length; i++) {
      let item = (this.list() as any[])[i];
      if (item.name.toLowerCase().indexOf(query.toLowerCase()) == 0) {
          filtered.push(item);
      }
    }
    this.filteredList = filtered;
  }

  listAllSuppliersPage(filter: SupplierFilter, page: number, size: number): Observable<Page<ListSuppliers>> {
    let url  = `${ URL_SERVICES }?page=${page}&size=${size}`;

    if (filter.name)
      url = `${url}&name=${filter.name}`;

    if (filter.cityId)
      url = `${url}&cityId=${filter.cityId}`;

    if (filter.status)
      url = `${url}&status=${filter.status}`;

    if (filter.notes)
      url = `${url}&notes=${filter.notes}`;

    if (filter.shortBy)
      url = `${url}&shortBy=${filter.shortBy}`;

    if (filter.shortOrder)
      url = `${url}&shortOrder=${filter.shortOrder}`;

    if (filter.countryId)
      url = `${url}&countryId=${filter.countryId}`;

    if (filter.taxId)
      url = `${url}&taxId=${filter.taxId}`;

    return this.http.get<Page<ListSuppliers>>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  private openAndLockProcessQueue() {
    this.openAndLockRequestQueue.pipe(
      concatMap(({ supplierId, type, observer }) =>
        this.http.get<{data: Supplier, isValidOpen: boolean}>(`${URL_SERVICES}/open-and-lock/${supplierId}?type=${type.toUpperCase()}`, {headers: this.authSV.headers()}).pipe(
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

  openAndLockSupplier(supplierId: string, type: TypeTab): Observable<{data: Supplier, isValidOpen: boolean}> {
    return new Observable(observer => {
      this.openAndLockRequestQueue.next({ supplierId, type, observer });
    });
  }

  /**
   * @deprecated Esta función será eliminada en futuras versiones. Utiliza la función nuevaFunction() en su lugar.
  */
  dashboard(): Observable<number> {
    let url  = `${ URL_SERVICES }/dashboard`;
    return this.http.get<number>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  loadOpenSuppliers(): Observable<ListSuppliers[]> {
    let url  = `${ URL_SERVICES }/load-open-suppliers`;
    return this.http.get<ListSuppliers[]>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  closeListSuppliers(listIds: string[]): Observable<MessageResponse<string[]>> {
    let url  = `${ URL_SERVICES }/close-list-suppliers`;
    return this.http.put<MessageResponse<string[]>>( url, listIds, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  closeSupplier(id: string): Observable<MessageResponse<string>> {
    let url  = `${ URL_SERVICES }/close-supplier/${id}`;
    return this.http.put<MessageResponse<string>>( url, {}, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  create(request: SupplierRequest): Observable<MessageResponse<Supplier>> {
    const url  = `${ URL_SERVICES }/create`;
    return this.http.post<MessageResponse<Supplier>>( url, request, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error ))
      );
  }

  update(id: string, request: SupplierRequest): Observable<MessageResponse<Supplier>> {
    const url  = `${ URL_SERVICES }/update/${id}`;
    return this.http.put<MessageResponse<Supplier>>( url, request, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error ))
      );
  }
}

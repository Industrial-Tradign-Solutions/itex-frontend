import { inject, Injectable, Signal, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { catchError, concatMap, map, Observable, of, Subject, tap, throwError } from 'rxjs';
import { BasicIpProduct, IpProduct, IpProductAddSurplusRequest, IpProductOutSurplusRequest, IpProductsFilter, IpProductsHistory, IpProductsRequest, ListIpProduct } from '@interfaces/ip/products';
import { AuthService } from '@services/security';
import { HttpClient } from '@angular/common/http';
import { MessageResponse } from '@interfaces/message-response';
import { Page } from '@interfaces/page.model';
import { TypeTab } from '@config/types/tabs';
import { BaseAutoCompleteService } from '@services/base-auto-complete-service.service';
import { storageKeys } from '../../../environments';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { IpImportProductsRequest, IpImportProductsResponse, IpImportProductsValidateRequest } from '@interfaces/ip/products/ipProductImportRequest.type';

const URL_SERVICES = environment.api_url + 'ip/products';
const IP_PRODUCTS_STORAGE_KEY = storageKeys.lists.list_ip_products;

@Injectable({
  providedIn: 'root'
})
export class IpProductsService extends BaseAutoCompleteService<BasicIpProduct> {

  //! Inyecciones
  private authSV     = inject(AuthService);
  private http       = inject(HttpClient);
  //!---------------------------------------

  private openAndLockRequestQueue = new Subject<{ productId: string, type: TypeTab, observer: any }>();

  constructor() {
    super();
    this.openAndLockProcessQueue();
  }

  createProduct(request: IpProductsRequest): Observable<MessageResponse<IpProduct>> {
    const url  = `${ URL_SERVICES }`;
    return this.http.post<MessageResponse<IpProduct>>( url, request, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error ))
      );
  }

  updateProduct(id: string, request: IpProductsRequest): Observable<MessageResponse<IpProduct>> {
    const url  = `${ URL_SERVICES }/${id}`;
    return this.http.put<MessageResponse<IpProduct>>( url, request, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error ))
      );
  }

  loadOpenProducts(): Observable<ListIpProduct[]> {
    let url  = `${ URL_SERVICES }/load-open`;
    return this.http.get<ListIpProduct[]>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
    );
  }

  getProductHistory(id: string): Observable<IpProductsHistory[]> {
    let url  = `${ URL_SERVICES }/history/${id}`;
    return this.http.get<IpProductsHistory[]>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage )),
        map(resp => {
          resp.forEach(item => {
            if (item.action === 'REPLACE' || item.action === 'UPDATE')
              item.data = this.transformDataToArray(item.data);
          });
          return resp;
        })
    );
  }

  private transformDataToArray(data: Record<string, { new: string; old: string }>) {
    return Object.entries(data).map(([key, value]) => ({
      key,
      ...value
    }));
  }

  openAndLockProduct(productId: string, type: TypeTab): Observable<{data: IpProduct, isValidOpen: boolean}> {
    return new Observable(observer => {
      this.openAndLockRequestQueue.next({ productId, type, observer });
    });
  }

  private openAndLockProcessQueue() {
    this.openAndLockRequestQueue.pipe(
      concatMap(({ productId, type, observer }) =>
        this.http.patch<{data: IpProduct, isValidOpen: boolean}>(`${URL_SERVICES}/open-lock/${productId}?type=${type.toUpperCase()}`, null, {headers: this.authSV.headers()}).pipe(
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

  closeListProducts(listIds: string[]): Observable<MessageResponse<string[]>> {
    const url = `${URL_SERVICES}/close-list`;
    return this.http.patch<MessageResponse<string[]>>(url, listIds.filter(id => id !== 'import'), { headers: this.authSV.headers() })
      .pipe(
        catchError(err => throwError(() => err.error?.errorMessage ?? 'Error al cerrar la lista'))
      );
  }

  closeProduct(id: string): Observable<MessageResponse<string>> {
    let url  = `${ URL_SERVICES }/close/${id}`;
    return this.http.patch<MessageResponse<string>>( url, {}, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
    );
  }


  addSurplusProduct(id: string, request: IpProductAddSurplusRequest): Observable<MessageResponse<IpProduct>> {
    let url  = `${ URL_SERVICES }/surplus/add/${id}`;
    return this.http.post<MessageResponse<IpProduct>>( url, request, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
    );
  }

  outSurplusProduct(id: string, request: IpProductOutSurplusRequest): Observable<MessageResponse<IpProduct>> {
    let url  = `${ URL_SERVICES }/surplus/out/${id}`;
    return this.http.post<MessageResponse<IpProduct>>( url, request, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
    );
  }


  disableProduct(id: string): Observable<MessageResponse<ListIpProduct>> {
    let url  = `${ URL_SERVICES }/${id}`;
    return this.http.delete<MessageResponse<ListIpProduct>>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
    );
  }

  enableProduct(id: string): Observable<MessageResponse<ListIpProduct>> {
    let url  = `${ URL_SERVICES }/enable/${id}`;
    return this.http.patch<MessageResponse<ListIpProduct>>( url, null, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
    );
  }

  substituteProduct(data: {productId: string; newProductId: string}): Observable<MessageResponse<IpProduct>> {
    let url  = `${ URL_SERVICES }/replace`;
    return this.http.patch<MessageResponse<IpProduct>>( url, data, {headers: this.authSV.headers()} )
      .pipe(
        tap(() => this.storageSV.delete(IP_PRODUCTS_STORAGE_KEY)),
        catchError( err => throwError( () => err.error.errorMessage ))
    );
  }

  listAllProductsPage(filter: IpProductsFilter, page: number, size: number): Observable<Page<ListIpProduct>> {
    let url  = `${ URL_SERVICES }?page=${page}&size=${size}`;

    if (filter.brandId)
      url = `${url}&brandId=${filter.brandId}`;

    if (filter.description)
      url = `${url}&description=${filter.description}`;

    if (filter.status)
      url = `${url}&status=${filter.status}`;

    if (filter.mfrReference)
      url = `${url}&mfrReference=${filter.mfrReference}`;

    if (filter.shortBy)
      url = `${url}&shortBy=${filter.shortBy}`;

    if (filter.shortOrder)
      url = `${url}&shortOrder=${filter.shortOrder}`;

    if (filter.nmfc)
      url = `${url}&nmfc=${filter.nmfc}`;

    if (filter.freightClass)
      url = `${url}&freightClass=${filter.freightClass}`;

    if (filter.notesKeywords)
      url = `${url}&notesKeywords=${filter.notesKeywords}`;

    return this.http.get<Page<ListIpProduct>>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  loadBasicProducts(): void{
    this.loadBasicsAction().subscribe({
      next: resp => {
        this._listItems = resp;
      }
    });
  }

  private loadBasicsAction(): Observable<BasicIpProduct[]> {
    const url  = `${ URL_SERVICES }/basic`;
    return this.http.get<BasicIpProduct[]>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  override searchAutoComplete(event: AutoCompleteCompleteEvent) {
    let filtered: BasicIpProduct[] = [];
    let query = event.query;

    for (let i = 0; i < (this.list() as any[]).length; i++) {
      let item = (this.list() as any[])[i];
      if (
        item.name.toLowerCase().indexOf(query.toLowerCase()) == 0 ||
        item.description.toLowerCase().indexOf(query.toLowerCase()) == 0 ||
        item.clientDescription.toLowerCase().indexOf(query.toLowerCase()) == 0 ||
        item.mfrReference.toLowerCase().indexOf(query.toLowerCase()) == 0 ||
        item.clientReference.toLowerCase().indexOf(query.toLowerCase()) == 0
      ) {
          filtered.push(item);
      }
    }
    this.filteredList = filtered;
  }

  get listIpProducts(): Signal<BasicIpProduct[]> {
    return this.list;
  }

  get filteredIpProducts(): BasicIpProduct[] {
    return this.filteredList;
  }

  addDisableItemAction(item: BasicIpProduct) {
    this.addDisableItem(item);
  }

  validateImportProduct(importProducts: IpImportProductsValidateRequest[]): Observable<IpImportProductsResponse[]> {
    const url = `${URL_SERVICES}/validate-import`;
    return this.http.patch<IpImportProductsResponse[]>(url, importProducts, { headers: this.authSV.headers() })
      .pipe(
        catchError(err => throwError(() => err.error.errorMessage))
      );
  }

  importProduct(request: IpImportProductsRequest[]): Observable<MessageResponse<IpProduct[]>> {
    const url  = `${ URL_SERVICES }/import-products`;
    return this.http.post<MessageResponse<IpProduct[]>>( url, request, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error ))
      );
  }
}

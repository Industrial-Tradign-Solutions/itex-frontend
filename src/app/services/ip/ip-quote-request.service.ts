import { inject, Injectable } from '@angular/core';
import { BaseAutoCompleteService } from '@services/base-auto-complete-service.service';
import { environment } from '../../../environments/environment';
import { MessageResponse } from '@interfaces/message-response';
import { catchError, concatMap, map, Observable, of, Subject, throwError } from 'rxjs';
import { AuthService } from '@services/security';
import { HttpClient } from '@angular/common/http';
import { IpQuoteRequestFilter, IpQuoteRequestOtherChargeRequest, IpQuoteRequestOtherCharges, IpQuoteRequestProduct, IpQuoteRequestProductRequest, IpQuoteRequestRequest, ListIpQuoteRequest } from '@interfaces/ip/quoteRequest';
import { Page } from '@interfaces/page.model';
import { TypeTab } from '@config/types/tabs';
import { IpQuoteRequest } from '@interfaces/ip/quoteRequest/ipQuoteRequest.type';

const URL_SERVICES = environment.api_url + 'ip/qr';

@Injectable({
  providedIn: 'root'
})
export class IpQuoteRequestService extends  BaseAutoCompleteService<any> {

  //! Inyecciones
  private authSV     = inject(AuthService);
  private http       = inject(HttpClient);
  //!---------------------------------------

  private openAndLockRequestQueue = new Subject<{ quoteRequestId: string, type: TypeTab, observer: any }>();

  constructor() {
    super();
    this.openAndLockProcessQueue();
  }

  closeListQuoteRequests(listIds?: string[]): Observable<MessageResponse<string[]>> {
    let url  = `${ URL_SERVICES }/close-list`;
    return this.http.patch<MessageResponse<string[]>>( url, null, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
    );
  }

  openAndLockQuoteRequest(quoteRequestId: string, type: TypeTab): Observable<{data: IpQuoteRequest, isValidOpen: boolean}> {
    return new Observable(observer => {
      this.openAndLockRequestQueue.next({ quoteRequestId, type, observer });
    });
  }

  getQuoteRequestById(quoteRequestId: string): Observable<IpQuoteRequest> {
    return this.http.patch<{data: IpQuoteRequest, isValidOpen: boolean}>(
      `${URL_SERVICES}/open-lock/${quoteRequestId}?type=VIEW`,
      null,
      {headers: this.authSV.headers()}
    ).pipe(
      map(resp => resp.data),
      catchError( err => throwError( () => err.error.errorMessage ))
    );
  }


  private openAndLockProcessQueue() {
    this.openAndLockRequestQueue.pipe(
      concatMap(({ quoteRequestId, type, observer }) =>
        this.http.patch<{data: IpQuoteRequest, isValidOpen: boolean}>(`${URL_SERVICES}/open-lock/${quoteRequestId}?type=${type.toUpperCase()}`, null, {headers: this.authSV.headers()}).pipe(
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

  loadOpenQuoteRequests(): Observable<ListIpQuoteRequest[]> {
    let url  = `${ URL_SERVICES }/load-open`;
    return this.http.get<ListIpQuoteRequest[]>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
    );
  }

  closeQuoteRequest(id: string): Observable<MessageResponse<string>> {
    let url  = `${ URL_SERVICES }/close/${id}`;
    return this.http.patch<MessageResponse<string>>( url, {}, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
    );
  }

  cloneQuoteRequest(id: string): Observable<MessageResponse<ListIpQuoteRequest>> {
    let url  = `${ URL_SERVICES }/clone/${id}`;
    return this.http.patch<MessageResponse<ListIpQuoteRequest>>( url, null, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
    );
  }

  listAllQuoteRequestsPage(filter: IpQuoteRequestFilter, page: number, size: number): Observable<Page<ListIpQuoteRequest>> {
    let url  = `${ URL_SERVICES }?page=${page}&size=${size}`;

    if (filter.number)
      url = `${url}&number=${filter.number}`;

    if (filter.status)
      url = `${url}&status=${filter.status}`;

    if (filter.clientId)
      url = `${url}&clientId=${filter.clientId}`;

    if (filter.supplierId)
      url = `${url}&supplierId=${filter.supplierId}`;

    if (filter.remarks)
      url = `${url}&remarks=${filter.remarks}`;

    if (filter.salesRepId)
      url = `${url}&salesRepId=${filter.salesRepId}`;

    if (filter.clientRef)
      url = `${url}&clientRef=${filter.clientRef}`;

    if (filter.supplierRef)
      url = `${url}&supplierRef=${filter.supplierRef}`;

    if (filter.productDescription)
      url = `${url}&productDescription=${filter.productDescription}`;

    if (filter.shortBy)
      url = `${url}&shortBy=${filter.shortBy}`;

    if (filter.shortOrder)
      url = `${url}&shortOrder=${filter.shortOrder}`;

    if (filter.date)
      url = `${url}&date=${filter.date}`;

    if ( filter.date === 'ALL' && filter.initDate)
      url = `${url}&initDate=${filter.initDate.toISOString()}`;

    if ( filter.date === 'ALL' && filter.endDate)
      url = `${url}&endDate=${filter.endDate.toISOString()}`;

    return this.http.get<Page<ListIpQuoteRequest>>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  createQuoteRequest(request: IpQuoteRequestRequest): Observable<MessageResponse<IpQuoteRequest>> {
    const url  = `${ URL_SERVICES }`;
    return this.http.post<MessageResponse<IpQuoteRequest>>( url, request, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error ))
      );
  }

  updateQuoteRequest(id: string, request: IpQuoteRequestRequest): Observable<MessageResponse<IpQuoteRequest>> {
    const url  = `${ URL_SERVICES }/${id}`;
    return this.http.put<MessageResponse<IpQuoteRequest>>( url, request, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error ))
      );
  }

  getQuoteRequestProduct(idQrProduct: string, idQr: string): Observable<IpQuoteRequestProduct> {
    const url  = `${ URL_SERVICES }/${idQr}/product/${idQrProduct}`;
    return this.http.get<IpQuoteRequestProduct>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  createQuoteRequestProduct(idQr: string, data: IpQuoteRequestProductRequest): Observable<MessageResponse<IpQuoteRequestProduct>> {
    const url  = `${ URL_SERVICES }/${idQr}/product`;
    return this.http.post<MessageResponse<IpQuoteRequestProduct>>( url, data , {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  updateQuoteRequestProduct(idQrProduct: string, idQr: string, data: IpQuoteRequestProductRequest): Observable<MessageResponse<IpQuoteRequestProduct>> {
    const url  = `${ URL_SERVICES }/${idQr}/product/${idQrProduct}`;
    return this.http.put<MessageResponse<IpQuoteRequestProduct>>( url, data, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  removeQuoteRequestProduct(idQrProduct: string, idQr: string): Observable<MessageResponse<IpQuoteRequestProduct>> {
    const url  = `${ URL_SERVICES }/${idQr}/product/${idQrProduct}`;
    return this.http.delete<MessageResponse<IpQuoteRequestProduct>>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  getQuoteRequestOtherCharge(idQrOtherCharge: string, idQr: string): Observable<IpQuoteRequestOtherCharges> {
    const url  = `${ URL_SERVICES }/${idQr}/other_charges/${idQrOtherCharge}`;
    return this.http.get<IpQuoteRequestOtherCharges>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  createQuoteRequestOtherCharge(idQr: string, data: IpQuoteRequestOtherChargeRequest): Observable<MessageResponse<IpQuoteRequestOtherCharges>> {
    const url  = `${ URL_SERVICES }/${idQr}/other_charges`;
    return this.http.post<MessageResponse<IpQuoteRequestOtherCharges>>( url, data , {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  updateQuoteRequestOtherCharge(idQrOtherCharge: string, idQr: string, data: IpQuoteRequestOtherChargeRequest): Observable<MessageResponse<IpQuoteRequestOtherCharges>> {
    const url  = `${ URL_SERVICES }/${idQr}/other_charges/${idQrOtherCharge}`;
    return this.http.put<MessageResponse<IpQuoteRequestOtherCharges>>( url, data, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  removeQuoteRequestOtherCharge(idQrOtherCharge: string, idQr: string): Observable<MessageResponse<string>> {
    const url  = `${ URL_SERVICES }/${idQr}/other_charges/${idQrOtherCharge}`;
    return this.http.delete<MessageResponse<string>>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  printQuoteRequest(quoteRequestId: string): Observable<Blob> {
    const url  = `${ URL_SERVICES }/print/${quoteRequestId}`;
    return this.http.get( url,  {headers: this.authSV.headersBlob(), responseType: 'blob'} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  changeStatusQuoteRequest(quoteRequestId: string, status: 'CREATED' | 'ANSWERED' | 'COMPLETE' | 'SENT' ): Observable<MessageResponse<ListIpQuoteRequest>> {
    const url  = `${ URL_SERVICES }/${quoteRequestId}/change-status?status=${status}`;
    return this.http.patch<MessageResponse<ListIpQuoteRequest>>( url, {}, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  rejectQuoteRequest(quoteRequestId: string): Observable<MessageResponse<ListIpQuoteRequest>> {
    const url  = `${ URL_SERVICES }/${quoteRequestId}`;
    return this.http.delete<MessageResponse<ListIpQuoteRequest>>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  getListQuoteRequestByClientAvailableToQuotation(clientId: string, viewCompletedQR: boolean, currency: string): Observable<ListIpQuoteRequest[]> {
    let url  = `${ URL_SERVICES }/available-for-quotation/${clientId}?view-completed-qr=${viewCompletedQR}&currency=${currency}`;
    return this.http.get<ListIpQuoteRequest[]>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
    );
  }
}

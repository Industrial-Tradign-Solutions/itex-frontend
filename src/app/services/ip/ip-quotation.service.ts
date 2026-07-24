import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { EmitedTab, TypeTab } from '@config/types/tabs';
import { MessageResponse } from '@interfaces/message-response';
import { BaseAutoCompleteService } from '@services/base-auto-complete-service.service';
import { AuthService } from '@services/security';
import { catchError, concatMap, map, Observable, of, Subject, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AvailableForPurchaseOrder, CreateIpQuotationRequest, IpQuotation, IpQuotationFilter, ListIpQuotation, IpQuotationOtherCharge, IpQuotationOtherChargeRequest, IpQuotationImportedOtherCharge, IpQuotationOtherChargeAvailableFromQr, IpQuotationOtherChargeImportRequest, IpQuotationAddQrRequest, IpQuotationRequest, IpQuotationProductBulkRequest, IpQuotationProduct, IpQuotationHistoryResponse } from '@interfaces/ip/quotation';
import { Page } from '@interfaces/page.model';

const URL_SERVICES = environment.api_url + 'ip/q';

@Injectable({
  providedIn: 'root'
})
export class IpQuotationService extends  BaseAutoCompleteService<any>{

  //! Inyecciones
  private readonly authSV     = inject(AuthService);
  private readonly http       = inject(HttpClient);
  //!---------------------------------------

  private openAndLockRequestQueue = new Subject<{ quotationId: string, type: TypeTab, observer: any }>();

  constructor() {
    super();
    this.openAndLockProcessQueue();
  }

  loadOpenQuotations(): Observable<ListIpQuotation[]> {
    let url  = `${ URL_SERVICES }/load-open`;
    return this.http.get<ListIpQuotation[]>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
    );
  }

  closeListQuotations(listIds?: string[]): Observable<MessageResponse<string[]>> {
    let url  = `${ URL_SERVICES }/close-list`;
    return this.http.patch<MessageResponse<string[]>>( url, null, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
    );
  }

  closeQuotation(id: string): Observable<MessageResponse<string>> {
    let url  = `${ URL_SERVICES }/close/${id}`;
    return this.http.patch<MessageResponse<string>>( url, {}, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
    );
  }

  listAllQuotationsPage(filter: IpQuotationFilter, page: number, size: number): Observable<Page<ListIpQuotation>> {
    let url  = `${ URL_SERVICES }?page=${page}&size=${size}`;

    if (filter.number)
      url = `${url}&number=${filter.number}`;

    if (filter.status)
      url = `${url}&status=${filter.status}`;

    if (filter.clientId)
      url = `${url}&clientId=${filter.clientId}`;

    if (filter.remarks)
      url = `${url}&remarks=${filter.remarks}`;

    if (filter.salesRepId)
      url = `${url}&salesRepId=${filter.salesRepId}`;

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

    return this.http.get<Page<ListIpQuotation>>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  createQuotation(request: CreateIpQuotationRequest): Observable<MessageResponse<EmitedTab<ListIpQuotation>>> {
    const url  = `${ URL_SERVICES }`;
    return this.http.post<MessageResponse<ListIpQuotation>>( url, request, {headers: this.authSV.headers()} )
      .pipe(
        map(response => {
          const resp: MessageResponse<EmitedTab<ListIpQuotation>> = {
            title: response.title,
            message: response.message,
            data: {
              item: response.data,
              pristine: true,
              type: 'edit'
            }
          };
          return resp;
        }),
        catchError( err => throwError( () => err.error ))
      );
  }

  updateQuotation(id: string, request: IpQuotationRequest): Observable<MessageResponse<IpQuotation>> {
    const url  = `${ URL_SERVICES }/${id}`;
    return this.http.put<MessageResponse<IpQuotation>>( url, request, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error ))
      );
  }

  changeStatusQuotation(id: string, status: 'CREATED' | 'ANSWERED' | 'COMPLETE' | 'SENT' ): Observable<MessageResponse<ListIpQuotation>> {
    const url  = `${ URL_SERVICES }/${id}/change-status?status=${status}`;
    return this.http.patch<MessageResponse<ListIpQuotation>>( url, {}, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  rejectQuotation(id: string): Observable<MessageResponse<ListIpQuotation>> {
    const url  = `${ URL_SERVICES }/${id}`;
    return this.http.delete<MessageResponse<ListIpQuotation>>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  openAndLockQuotation(quotationId: string, type: TypeTab): Observable<{data: IpQuotation, isValidOpen: boolean}> {
    return new Observable(observer => {
      this.openAndLockRequestQueue.next({ quotationId, type, observer });
    });
  }

  private openAndLockProcessQueue() {
    this.openAndLockRequestQueue.pipe(
      concatMap(({ quotationId, type, observer }) =>
        this.http.patch<{data: IpQuotation, isValidOpen: boolean}>(`${URL_SERVICES}/open-lock/${quotationId}?type=${type.toUpperCase()}`, null, {headers: this.authSV.headers()}).pipe(
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

  createQuotationProductsBulk(qId: string, request: IpQuotationProductBulkRequest): Observable<MessageResponse<IpQuotationProduct[]>> {
    const url = `${URL_SERVICES}/${qId}/product`;
    return this.http.post<MessageResponse<IpQuotationProduct[]>>(url, request, { headers: this.authSV.headers() })
      .pipe(
        catchError(err => throwError(() => err.error.errorMessage))
      );
  }

  updateQuotationProduct(qId: string, qProductId: string, qProduct: any): Observable<MessageResponse<any>> {
    let url  = `${ URL_SERVICES }/${qId}/product/${qProductId}`;
    return this.http.put<MessageResponse<any>>( url, qProduct, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
    );
  }

  removeQuotationProduct(qProductId: string, qId: string): Observable<MessageResponse<any>> {
    let url  = `${ URL_SERVICES }/${qId}/product/${qProductId}`;
    return this.http.delete<MessageResponse<any>>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
    );
  }

  getQuotationProduct(qProductId: string, qId: string): Observable<any> {
    let url  = `${ URL_SERVICES }/${qId}/product/${qProductId}`;
    return this.http.get<any>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
    );
  }

  removeQuoteRequestFromQuotation(qId: string, qqrId: string): Observable<MessageResponse<string>> {
    const url = `${ URL_SERVICES }/${qId}/quote-requests/${qqrId}`;
    return this.http.delete<MessageResponse<string>>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  cloneQuotation(id: string): Observable<MessageResponse<ListIpQuotation>> {
    const url = `${ URL_SERVICES }/clone/${id}`;
    return this.http.patch<MessageResponse<ListIpQuotation>>( url, null, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  addQuoteRequestsToQuotation(qId: string, request: IpQuotationAddQrRequest): Observable<MessageResponse<IpQuotation>> {
    const url = `${ URL_SERVICES }/${qId}/quote-requests`;
    return this.http.post<MessageResponse<IpQuotation>>( url, request, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error ))
      );
  }

  createQuotationOtherCharge(qId: string, data: IpQuotationOtherChargeRequest): Observable<MessageResponse<IpQuotationOtherCharge>> {
    const url = `${ URL_SERVICES }/${qId}/other_charges`;
    return this.http.post<MessageResponse<IpQuotationOtherCharge>>( url, data, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  updateQuotationOtherCharge(qId: string, ocId: string, data: IpQuotationOtherChargeRequest): Observable<MessageResponse<IpQuotationOtherCharge>> {
    const url = `${ URL_SERVICES }/${qId}/other_charges/${ocId}`;
    return this.http.put<MessageResponse<IpQuotationOtherCharge>>( url, data, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  getQuotationOtherCharge(qId: string, ocId: string): Observable<IpQuotationOtherCharge> {
    const url = `${ URL_SERVICES }/${qId}/other_charges/${ocId}`;
    return this.http.get<IpQuotationOtherCharge>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  removeQuotationOtherCharge(qId: string, ocId: string): Observable<MessageResponse<string>> {
    const url = `${ URL_SERVICES }/${qId}/other_charges/${ocId}`;
    return this.http.delete<MessageResponse<string>>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  getAvailableOtherChargesFromQr(qId: string): Observable<IpQuotationOtherChargeAvailableFromQr[]> {
    const url = `${ URL_SERVICES }/${qId}/other_charges/available-from-qr`;
    return this.http.get<IpQuotationOtherChargeAvailableFromQr[]>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  importOtherChargesFromQr(qId: string, request: IpQuotationOtherChargeImportRequest): Observable<MessageResponse<IpQuotationImportedOtherCharge[]>> {
    const url = `${ URL_SERVICES }/${qId}/other_charges/import-from-qr`;
    return this.http.post<MessageResponse<IpQuotationImportedOtherCharge[]>>( url, request, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  getImportedOtherChargeFromQr(qId: string, id: string): Observable<IpQuotationImportedOtherCharge> {
    const url = `${ URL_SERVICES }/${qId}/other_charges/imported-from-qr/${id}`;
    return this.http.get<IpQuotationImportedOtherCharge>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  removeImportedOtherChargeFromQr(qId: string, id: string): Observable<MessageResponse<string>> {
    const url = `${ URL_SERVICES }/${qId}/other_charges/imported-from-qr/${id}`;
    return this.http.delete<MessageResponse<string>>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  printQuotation(qId: string): Observable<Blob> {
    const url = `${ URL_SERVICES }/print/${qId}`;
    return this.http.get( url, {headers: this.authSV.headersBlob(), responseType: 'blob'} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  getQuotationHistory(id: string): Observable<IpQuotationHistoryResponse[]> {
    const url = `${ URL_SERVICES }/history/${id}`;
    return this.http.get<IpQuotationHistoryResponse[]>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  getQuotationsAvailableForPurchaseOrder(clientId: string, viewCompleted: boolean = false, currency: string = 'USD'): Observable<AvailableForPurchaseOrder[]> {
    const url = `${URL_SERVICES}/available-for-purchase-order/${clientId}?viewCompleted=${viewCompleted}&currency=${currency}`;
    return this.http.get<AvailableForPurchaseOrder[]>(url, { headers: this.authSV.headers() })
      .pipe(
        catchError(err => throwError(() => err.error.errorMessage))
      );
  }
}

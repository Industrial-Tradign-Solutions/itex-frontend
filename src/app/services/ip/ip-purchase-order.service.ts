import { inject, Injectable } from '@angular/core';
import { BaseAutoCompleteService } from '@services/base-auto-complete-service.service';
import { environment } from '../../../environments/environment';
import { MessageResponse } from '@interfaces/message-response';
import { catchError, concatMap, Observable, of, Subject, throwError } from 'rxjs';
import { AuthService } from '@services/security';
import { HttpClient } from '@angular/common/http';
import { IpPurchaseOrderFilter, IpPurchaseOrder, ListIpPurchaseOrder, CreatePurchaseOrderRequest, IpPurchaseOrderHistoryResponse } from '@interfaces/ip/purchaseOrder';
import { Page } from '@interfaces/page.model';
import { TypeTab } from '@config/types/tabs';

const URL_SERVICES = environment.api_url + 'ip/po';

@Injectable({
  providedIn: 'root'
})
export class IpPurchaseOrderService extends BaseAutoCompleteService<any> {

  private authSV = inject(AuthService);
  private http   = inject(HttpClient);

  private openAndLockRequestQueue = new Subject<{ purchaseOrderId: string, type: TypeTab, observer: any }>();

  constructor() {
    super();
    this.openAndLockProcessQueue();
  }

  closeListPurchaseOrders(): Observable<MessageResponse<string[]>> {
    let url = `${URL_SERVICES}/close-list`;
    return this.http.patch<MessageResponse<string[]>>(url, null, { headers: this.authSV.headers() })
      .pipe(
        catchError(err => throwError(() => err.error.errorMessage))
      );
  }

  openAndLockPurchaseOrder(purchaseOrderId: string, type: TypeTab): Observable<{ data: IpPurchaseOrder, isValidOpen: boolean }> {
    return new Observable(observer => {
      this.openAndLockRequestQueue.next({ purchaseOrderId, type, observer });
    });
  }

  private openAndLockProcessQueue() {
    this.openAndLockRequestQueue.pipe(
      concatMap(({ purchaseOrderId, type, observer }) =>
        this.http.patch<{ data: IpPurchaseOrder, isValidOpen: boolean }>(`${URL_SERVICES}/open-lock/${purchaseOrderId}?type=${type.toUpperCase()}`, null, { headers: this.authSV.headers() }).pipe(
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

  loadOpenPurchaseOrders(): Observable<ListIpPurchaseOrder[]> {
    let url = `${URL_SERVICES}/load-open`;
    return this.http.get<ListIpPurchaseOrder[]>(url, { headers: this.authSV.headers() })
      .pipe(
        catchError(err => throwError(() => err.error.errorMessage))
      );
  }

  closePurchaseOrder(id: string): Observable<MessageResponse<string>> {
    let url = `${URL_SERVICES}/close/${id}`;
    return this.http.patch<MessageResponse<string>>(url, {}, { headers: this.authSV.headers() })
      .pipe(
        catchError(err => throwError(() => err.error.errorMessage))
      );
  }

  clonePurchaseOrder(id: string): Observable<MessageResponse<ListIpPurchaseOrder>> {
    let url = `${URL_SERVICES}/clone/${id}`;
    return this.http.patch<MessageResponse<ListIpPurchaseOrder>>(url, null, { headers: this.authSV.headers() })
      .pipe(
        catchError(err => throwError(() => err.error.errorMessage))
      );
  }

  listAllPurchaseOrdersPage(filter: IpPurchaseOrderFilter, page: number, size: number): Observable<Page<ListIpPurchaseOrder>> {
    let url = `${URL_SERVICES}?page=${page}&size=${size}`;

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

    if (filter.date === 'ALL' && filter.initDate)
      url = `${url}&initDate=${filter.initDate.toISOString()}`;

    if (filter.date === 'ALL' && filter.endDate)
      url = `${url}&endDate=${filter.endDate.toISOString()}`;

    return this.http.get<Page<ListIpPurchaseOrder>>(url, { headers: this.authSV.headers() })
      .pipe(
        catchError(err => throwError(() => err.error.errorMessage))
      );
  }

  createPurchaseOrder(request: CreatePurchaseOrderRequest): Observable<MessageResponse<IpPurchaseOrder>> {
    const url = `${URL_SERVICES}`;
    return this.http.post<MessageResponse<IpPurchaseOrder>>(url, request, { headers: this.authSV.headers() })
      .pipe(
        catchError(err => throwError(() => err.error))
      );
  }

  changeQuotationPurchaseOrder(purchaseOrderId: string, quotationId: string): Observable<MessageResponse<IpPurchaseOrder>> {
    const url = `${URL_SERVICES}/quotation/${purchaseOrderId}`;
    return this.http.patch<MessageResponse<IpPurchaseOrder>>(url, { quotationId }, { headers: this.authSV.headers() })
      .pipe(
        catchError(err => throwError(() => err.error.errorMessage))
      );
  }

  getPurchaseOrderHistory(poId: string): Observable<IpPurchaseOrderHistoryResponse[]> {
    const url = `${URL_SERVICES}/history/${poId}`;
    return this.http.get<IpPurchaseOrderHistoryResponse[]>(url, { headers: this.authSV.headers() })
      .pipe(
        catchError(err => throwError(() => err.error.errorMessage))
      );
  }

  //#region TODO Stubs

  updatePurchaseOrder(id: string, request: any): Observable<MessageResponse<IpPurchaseOrder>> {
    throw new Error('TODO: implement updatePurchaseOrder');
  }

  getPurchaseOrderById(purchaseOrderId: string): Observable<IpPurchaseOrder> {
    throw new Error('TODO: implement getPurchaseOrderById');
  }

  printPurchaseOrder(purchaseOrderId: string): Observable<Blob> {
    throw new Error('TODO: implement printPurchaseOrder');
  }

  changeStatusPurchaseOrder(purchaseOrderId: string, status: string): Observable<MessageResponse<ListIpPurchaseOrder>> {
    throw new Error('TODO: implement changeStatusPurchaseOrder');
  }

  rejectPurchaseOrder(purchaseOrderId: string): Observable<MessageResponse<ListIpPurchaseOrder>> {
    throw new Error('TODO: implement rejectPurchaseOrder');
  }

  //#endregion
}

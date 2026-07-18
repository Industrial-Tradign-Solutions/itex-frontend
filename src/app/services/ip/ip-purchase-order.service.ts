import { inject, Injectable } from '@angular/core';
import { BaseAutoCompleteService } from '@services/base-auto-complete-service.service';
import { environment } from '../../../environments/environment';
import { MessageResponse } from '@interfaces/message-response';
import { catchError, concatMap, map, Observable, of, Subject, throwError } from 'rxjs';
import { AuthService } from '@services/security';
import { HttpClient } from '@angular/common/http';
import {
  IpPurchaseOrderFilter,
  IpPurchaseOrder,
  ListIpPurchaseOrder,
  CreatePurchaseOrderRequest,
  UpdatePurchaseOrderRequest,
  AddPurchaseOrderProductsRequest,
  PurchaseOrderOtherChargeRequest,
  ImportPurchaseOrderChargesRequest,
  IpPurchaseOrderHistoryResponse,
  IpPurchaseOrderProduct,
  IpPurchaseOrderOtherCharge,
  IpPurchaseOrderOtherChargesQuotation,
  IpPurchaseOrderOtherChargesQuotationQr,
  EligibleIpPurchaseOrderProduct,
  AvailableIpPurchaseOrderOtherCharge
} from '@interfaces/ip/purchaseOrder';
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

  private unwrap<T>(source: Observable<T>): Observable<T> {
    return source.pipe(catchError(err => throwError(() => err.error.errorMessage)));
  }

  //#region Management

  closeListPurchaseOrders(): Observable<MessageResponse<string[]>> {
    const url = `${URL_SERVICES}/close-list`;
    return this.unwrap(this.http.patch<MessageResponse<string[]>>(url, null, { headers: this.authSV.headers() }));
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
    const url = `${URL_SERVICES}/load-open`;
    return this.unwrap(this.http.get<ListIpPurchaseOrder[]>(url, { headers: this.authSV.headers() }));
  }

  closePurchaseOrder(id: string): Observable<MessageResponse<string>> {
    const url = `${URL_SERVICES}/close/${id}`;
    return this.unwrap(this.http.patch<MessageResponse<string>>(url, {}, { headers: this.authSV.headers() }));
  }

  clonePurchaseOrder(id: string): Observable<MessageResponse<ListIpPurchaseOrder>> {
    const url = `${URL_SERVICES}/clone/${id}`;
    return this.unwrap(this.http.patch<MessageResponse<ListIpPurchaseOrder>>(url, null, { headers: this.authSV.headers() }));
  }

  listAllPurchaseOrdersPage(filter: IpPurchaseOrderFilter, page: number, size: number): Observable<Page<ListIpPurchaseOrder>> {
    const params: Array<[string, string | undefined]> = [
      ['number', filter.number],
      ['status', filter.status],
      ['clientId', filter.clientId],
      ['supplierId', filter.supplierId],
      ['remarks', filter.remarks],
      ['salesRepId', filter.salesRepId],
      ['clientRef', filter.clientRef],
      ['supplierRef', filter.supplierRef],
      ['productDescription', filter.productDescription],
      ['shortBy', filter.shortBy],
      ['shortOrder', filter.shortOrder != null ? `${filter.shortOrder}` : undefined],
      ['date', filter.date],
      ['initDate', filter.date === 'ALL' && filter.initDate ? filter.initDate.toISOString() : undefined],
      ['endDate', filter.date === 'ALL' && filter.endDate ? filter.endDate.toISOString() : undefined]
    ];

    const url = params.reduce(
      (acc, [key, value]) => value ? `${acc}&${key}=${value}` : acc,
      `${URL_SERVICES}?page=${page}&size=${size}`
    );

    return this.unwrap(this.http.get<Page<ListIpPurchaseOrder>>(url, { headers: this.authSV.headers() }));
  }

  createPurchaseOrder(request: CreatePurchaseOrderRequest): Observable<MessageResponse<IpPurchaseOrder>> {
    const url = `${URL_SERVICES}`;
    // §2.1 returns the OpenLock wrapper { data: PO, isValidOpen } — unwrap to the PO so
    // callers get the real persisted id (root cause of the open-lock/undefined race).
    // Keeps full err.error (may carry formErrors) rather than only errorMessage.
    return this.http.post<MessageResponse<{ data: IpPurchaseOrder, isValidOpen: boolean }>>(url, request, { headers: this.authSV.headers() })
      .pipe(
        map(response => ({
          title: response.title,
          message: response.message,
          data: response.data.data
        }) as MessageResponse<IpPurchaseOrder>),
        catchError(err => throwError(() => err.error))
      );
  }

  updatePurchaseOrder(id: string, request: UpdatePurchaseOrderRequest): Observable<MessageResponse<IpPurchaseOrder>> {
    const url = `${URL_SERVICES}/${id}`;
    return this.unwrap(this.http.put<MessageResponse<IpPurchaseOrder>>(url, request, { headers: this.authSV.headers() }));
  }

  changeStatusPurchaseOrder(purchaseOrderId: string, status: string): Observable<MessageResponse<ListIpPurchaseOrder>> {
    const url = `${URL_SERVICES}/${purchaseOrderId}/change-status?status=${status}`;
    return this.unwrap(this.http.patch<MessageResponse<ListIpPurchaseOrder>>(url, null, { headers: this.authSV.headers() }));
  }

  rejectPurchaseOrder(purchaseOrderId: string): Observable<MessageResponse<ListIpPurchaseOrder>> {
    const url = `${URL_SERVICES}/${purchaseOrderId}`;
    return this.unwrap(this.http.delete<MessageResponse<ListIpPurchaseOrder>>(url, { headers: this.authSV.headers() }));
  }

  printPurchaseOrder(purchaseOrderId: string): Observable<Blob> {
    const url = `${URL_SERVICES}/print/${purchaseOrderId}`;
    return this.unwrap(this.http.get(url, { headers: this.authSV.headersBlob(), responseType: 'blob' }));
  }

  getPurchaseOrderHistory(poId: string): Observable<IpPurchaseOrderHistoryResponse[]> {
    const url = `${URL_SERVICES}/history/${poId}`;
    return this.unwrap(this.http.get<IpPurchaseOrderHistoryResponse[]>(url, { headers: this.authSV.headers() }));
  }

  //#endregion

  //#region Quotation association

  changeQuotationPurchaseOrder(purchaseOrderId: string, quotationId: string): Observable<MessageResponse<IpPurchaseOrder>> {
    const url = `${URL_SERVICES}/${purchaseOrderId}/quotation`;
    return this.unwrap(this.http.patch<MessageResponse<IpPurchaseOrder>>(url, { quotationId }, { headers: this.authSV.headers() }));
  }

  removeQuotationPurchaseOrder(purchaseOrderId: string): Observable<MessageResponse<IpPurchaseOrder>> {
    const url = `${URL_SERVICES}/${purchaseOrderId}/quotation`;
    return this.unwrap(this.http.delete<MessageResponse<IpPurchaseOrder>>(url, { headers: this.authSV.headers() }));
  }

  //#endregion

  //#region Products

  getAvailableProducts(purchaseOrderId: string): Observable<EligibleIpPurchaseOrderProduct[]> {
    const url = `${URL_SERVICES}/${purchaseOrderId}/product/available`;
    return this.unwrap(this.http.get<EligibleIpPurchaseOrderProduct[]>(url, { headers: this.authSV.headers() }));
  }

  addProducts(purchaseOrderId: string, request: AddPurchaseOrderProductsRequest): Observable<MessageResponse<IpPurchaseOrderProduct[]>> {
    const url = `${URL_SERVICES}/${purchaseOrderId}/product`;
    return this.unwrap(this.http.post<MessageResponse<IpPurchaseOrderProduct[]>>(url, request, { headers: this.authSV.headers() }));
  }

  removeProduct(purchaseOrderId: string, poProductId: string): Observable<MessageResponse<string>> {
    const url = `${URL_SERVICES}/${purchaseOrderId}/product/${poProductId}`;
    return this.unwrap(this.http.delete<MessageResponse<string>>(url, { headers: this.authSV.headers() }));
  }

  //#endregion

  //#region Other charges — own

  addOtherCharge(purchaseOrderId: string, request: PurchaseOrderOtherChargeRequest): Observable<MessageResponse<IpPurchaseOrderOtherCharge>> {
    const url = `${URL_SERVICES}/${purchaseOrderId}/other_charges`;
    return this.unwrap(this.http.post<MessageResponse<IpPurchaseOrderOtherCharge>>(url, request, { headers: this.authSV.headers() }));
  }

  updateOtherCharge(purchaseOrderId: string, chargeId: string, request: PurchaseOrderOtherChargeRequest): Observable<MessageResponse<IpPurchaseOrderOtherCharge>> {
    const url = `${URL_SERVICES}/${purchaseOrderId}/other_charges/${chargeId}`;
    return this.unwrap(this.http.put<MessageResponse<IpPurchaseOrderOtherCharge>>(url, request, { headers: this.authSV.headers() }));
  }

  removeOtherCharge(purchaseOrderId: string, chargeId: string): Observable<MessageResponse<string>> {
    const url = `${URL_SERVICES}/${purchaseOrderId}/other_charges/${chargeId}`;
    return this.unwrap(this.http.delete<MessageResponse<string>>(url, { headers: this.authSV.headers() }));
  }

  //#endregion

  //#region Other charges — imported from Quotation

  getAvailableChargesFromQuotation(purchaseOrderId: string): Observable<AvailableIpPurchaseOrderOtherCharge[]> {
    const url = `${URL_SERVICES}/${purchaseOrderId}/other_charges/available-from-quotation`;
    return this.unwrap(this.http.get<AvailableIpPurchaseOrderOtherCharge[]>(url, { headers: this.authSV.headers() }));
  }

  importChargesFromQuotation(purchaseOrderId: string, request: ImportPurchaseOrderChargesRequest): Observable<MessageResponse<IpPurchaseOrderOtherChargesQuotation[]>> {
    const url = `${URL_SERVICES}/${purchaseOrderId}/other_charges/import-from-quotation`;
    return this.unwrap(this.http.post<MessageResponse<IpPurchaseOrderOtherChargesQuotation[]>>(url, request, { headers: this.authSV.headers() }));
  }

  removeImportedChargeFromQuotation(purchaseOrderId: string, linkId: string): Observable<MessageResponse<string>> {
    const url = `${URL_SERVICES}/${purchaseOrderId}/other_charges/imported-from-quotation/${linkId}`;
    return this.unwrap(this.http.delete<MessageResponse<string>>(url, { headers: this.authSV.headers() }));
  }

  //#endregion

  //#region Other charges — imported from Quotation QR

  getAvailableChargesFromQuotationQr(purchaseOrderId: string): Observable<AvailableIpPurchaseOrderOtherCharge[]> {
    const url = `${URL_SERVICES}/${purchaseOrderId}/other_charges/available-from-quotation-qr`;
    return this.unwrap(this.http.get<AvailableIpPurchaseOrderOtherCharge[]>(url, { headers: this.authSV.headers() }));
  }

  importChargesFromQuotationQr(purchaseOrderId: string, request: ImportPurchaseOrderChargesRequest): Observable<MessageResponse<IpPurchaseOrderOtherChargesQuotationQr[]>> {
    const url = `${URL_SERVICES}/${purchaseOrderId}/other_charges/import-from-quotation-qr`;
    return this.unwrap(this.http.post<MessageResponse<IpPurchaseOrderOtherChargesQuotationQr[]>>(url, request, { headers: this.authSV.headers() }));
  }

  removeImportedChargeFromQuotationQr(purchaseOrderId: string, linkId: string): Observable<MessageResponse<string>> {
    const url = `${URL_SERVICES}/${purchaseOrderId}/other_charges/imported-from-quotation-qr/${linkId}`;
    return this.unwrap(this.http.delete<MessageResponse<string>>(url, { headers: this.authSV.headers() }));
  }

  //#endregion
}

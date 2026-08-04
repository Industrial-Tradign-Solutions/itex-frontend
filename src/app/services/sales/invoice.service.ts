import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { TypeTab } from '@config/types/tabs';
import { MessageResponse } from '@interfaces/message-response';
import { Page } from '@interfaces/page.model';
import {
  AvailablePoCharge,
  AvailablePoProduct,
  Invoice,
  InvoiceAssociatedPo,
  InvoiceCharge,
  InvoiceChargeImportRequest,
  InvoiceChargeRequest,
  InvoiceCreateRequest,
  InvoiceFilter,
  InvoiceOpenAndLock,
  InvoicePoLinkRequest,
  InvoiceProduct,
  InvoiceProductImportRequest,
  InvoiceProductRequest,
  InvoiceTax,
  InvoiceTaxRequest,
  InvoiceUpdateRequest,
  ListInvoice
} from '@interfaces/sales/invoice';
import { AuthService } from '@services/security';
import { catchError, concatMap, map, Observable, of, Subject, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

const URL_SERVICES = environment.api_url + 'sales/invoice';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {

  private authSV = inject(AuthService);
  private http   = inject(HttpClient);

  private openAndLockRequestQueue = new Subject<{ invoiceId: string, type: TypeTab, observer: any }>();

  constructor() {
    this.openAndLockProcessQueue();
  }

  // Collapses the error to its message. Not usable by create/update: those two
  // need the whole `err.error` because the 400 of a @Valid failure carries a
  // `formErrors` map that CommonPageTab renders field by field.
  private unwrap<T>(source: Observable<T>): Observable<T> {
    return source.pipe(catchError(err => throwError(() => err.error.errorMessage)));
  }

  // HttpParams (not string concatenation) so free-text filters such as `remarks`
  // can carry `&`, `#` or spaces without breaking the query.
  private buildParams(entries: Array<[string, unknown]>): HttpParams {
    return entries.reduce((params, [key, value]) => {
      if (value === undefined || value === null || value === '') {
        return params;
      }
      const plain = value instanceof Date ? value.toISOString() : `${value}`;
      return params.set(key, plain);
    }, new HttpParams());
  }

  //#region Management

  listAllInvoicesPage(filter: InvoiceFilter, page: number, size: number): Observable<Page<ListInvoice>> {
    // The custom range only applies when the quick filter is `ALL` (same rule as
    // the IP modules).
    const isCustomRange = filter.date === 'ALL';
    const params = this.buildParams([
      ['page', page],
      ['size', size],
      ['number', filter.number],
      ['draftNumber', filter.draftNumber],
      ['clientId', filter.clientId],
      ['remarks', filter.remarks],
      ['status', filter.status],
      ['salesRepId', filter.salesRepId],
      ['department', filter.department],
      ['overdue', filter.overdue],
      ['initDueAt', filter.initDueAt],
      ['endDueAt', filter.endDueAt],
      ['date', filter.date],
      ['initDate', isCustomRange ? filter.initDate : undefined],
      ['endDate', isCustomRange ? filter.endDate : undefined],
      ['shortBy', filter.shortBy],
      ['shortOrder', filter.shortOrder]
    ]);

    return this.unwrap(this.http.get<Page<ListInvoice>>(URL_SERVICES, { headers: this.authSV.headers(), params }));
  }

  loadOpenInvoices(): Observable<ListInvoice[]> {
    const url = `${URL_SERVICES}/load-open`;
    return this.unwrap(this.http.get<ListInvoice[]>(url, { headers: this.authSV.headers() }));
  }

  closeListInvoices(): Observable<MessageResponse<string[]>> {
    const url = `${URL_SERVICES}/close-list`;
    return this.unwrap(this.http.patch<MessageResponse<string[]>>(url, null, { headers: this.authSV.headers() }));
  }

  // Queued: several tabs restored at once would otherwise race against the
  // server-side lock and blow past `maxTabsOpen`.
  openAndLockInvoice(invoiceId: string, type: TypeTab): Observable<InvoiceOpenAndLock> {
    return new Observable(observer => {
      this.openAndLockRequestQueue.next({ invoiceId, type, observer });
    });
  }

  private openAndLockProcessQueue() {
    this.openAndLockRequestQueue.pipe(
      concatMap(({ invoiceId, type, observer }) => {
        const url = `${URL_SERVICES}/open-lock/${invoiceId}?type=${type.toUpperCase()}`;
        return this.http.patch<InvoiceOpenAndLock>(url, null, { headers: this.authSV.headers() }).pipe(
          catchError(err => {
            observer.error(err.error.errorMessage);
            return of(null);
          }),
          concatMap(response => {
            observer.next(response);
            observer.complete();
            return of(response);
          })
        );
      })
    ).subscribe();
  }

  closeInvoice(id: string): Observable<MessageResponse<string>> {
    const url = `${URL_SERVICES}/close/${id}`;
    return this.unwrap(this.http.patch<MessageResponse<string>>(url, {}, { headers: this.authSV.headers() }));
  }

  // §9 answers with the open-lock envelope { data: Invoice, isValidOpen } nested
  // inside the MessageResponse — flattened here so the caller gets the persisted
  // id straight away (the tab would keep `id: ''` otherwise). `isValidOpen` is
  // always true on create: the invoice is born locked by its creator.
  createInvoice(request: InvoiceCreateRequest): Observable<MessageResponse<Invoice>> {
    return this.http.post<MessageResponse<InvoiceOpenAndLock>>(URL_SERVICES, request, { headers: this.authSV.headers() })
      .pipe(
        map(response => ({
          title: response.title,
          message: response.message,
          data: response.data.data
        }) as MessageResponse<Invoice>),
        catchError(err => throwError(() => err.error))
      );
  }

  updateInvoice(id: string, request: InvoiceUpdateRequest): Observable<MessageResponse<Invoice>> {
    const url = `${URL_SERVICES}/${id}`;
    return this.http.put<MessageResponse<Invoice>>(url, request, { headers: this.authSV.headers() })
      .pipe(catchError(err => throwError(() => err.error)));
  }

  //#endregion

  //#region Sub-resources (§11 products, §12 charges, §13 taxes, §14 linked POs)
  // None of these answers with the whole invoice: they return the created/edited
  // line, or the id of the deleted one. Totals are recalculated and persisted
  // server-side, so the caller re-reads the detail (open-lock) afterwards
  // instead of patching anything locally.

  createInvoiceProduct(invoiceId: string, request: InvoiceProductRequest): Observable<MessageResponse<InvoiceProduct>> {
    const url = `${URL_SERVICES}/${invoiceId}/product`;
    return this.http.post<MessageResponse<InvoiceProduct>>(url, request, { headers: this.authSV.headers() })
      .pipe(catchError(err => throwError(() => err.error)));
  }

  updateInvoiceProduct(invoiceId: string, invoiceProductId: string, request: InvoiceProductRequest): Observable<MessageResponse<InvoiceProduct>> {
    const url = `${URL_SERVICES}/${invoiceId}/product/${invoiceProductId}`;
    return this.http.put<MessageResponse<InvoiceProduct>>(url, request, { headers: this.authSV.headers() })
      .pipe(catchError(err => throwError(() => err.error)));
  }

  removeInvoiceProduct(invoiceId: string, invoiceProductId: string): Observable<MessageResponse<string>> {
    const url = `${URL_SERVICES}/${invoiceId}/product/${invoiceProductId}`;
    return this.http.delete<MessageResponse<string>>(url, { headers: this.authSV.headers() })
      .pipe(catchError(err => throwError(() => err.error)));
  }

  getAvailablePoProducts(invoiceId: string): Observable<AvailablePoProduct[]> {
    const url = `${URL_SERVICES}/${invoiceId}/product/available-from-pos`;
    return this.unwrap(this.http.get<AvailablePoProduct[]>(url, { headers: this.authSV.headers() }));
  }

  // §11.5 imports one PO per call, so a multi-PO selection means several calls.
  importProductsFromPo(invoiceId: string, request: InvoiceProductImportRequest): Observable<MessageResponse<InvoiceProduct[]>> {
    const url = `${URL_SERVICES}/${invoiceId}/product/import-from-po`;
    return this.http.post<MessageResponse<InvoiceProduct[]>>(url, request, { headers: this.authSV.headers() })
      .pipe(catchError(err => throwError(() => err.error)));
  }

  createInvoiceCharge(invoiceId: string, request: InvoiceChargeRequest): Observable<MessageResponse<InvoiceCharge>> {
    const url = `${URL_SERVICES}/${invoiceId}/charge`;
    return this.http.post<MessageResponse<InvoiceCharge>>(url, request, { headers: this.authSV.headers() })
      .pipe(catchError(err => throwError(() => err.error)));
  }

  updateInvoiceCharge(invoiceId: string, chargeId: string, request: InvoiceChargeRequest): Observable<MessageResponse<InvoiceCharge>> {
    const url = `${URL_SERVICES}/${invoiceId}/charge/${chargeId}`;
    return this.http.put<MessageResponse<InvoiceCharge>>(url, request, { headers: this.authSV.headers() })
      .pipe(catchError(err => throwError(() => err.error)));
  }

  removeInvoiceCharge(invoiceId: string, chargeId: string): Observable<MessageResponse<string>> {
    const url = `${URL_SERVICES}/${invoiceId}/charge/${chargeId}`;
    return this.http.delete<MessageResponse<string>>(url, { headers: this.authSV.headers() })
      .pipe(catchError(err => throwError(() => err.error)));
  }

  getAvailablePoCharges(invoiceId: string): Observable<AvailablePoCharge[]> {
    const url = `${URL_SERVICES}/${invoiceId}/charge/available-from-pos`;
    return this.unwrap(this.http.get<AvailablePoCharge[]>(url, { headers: this.authSV.headers() }));
  }

  // §12.3 takes the whole PO: every other charge lands as a charge, and the
  // PO's `salesTax` lands as a tax record that this response does not list.
  importChargesFromPo(invoiceId: string, request: InvoiceChargeImportRequest): Observable<MessageResponse<InvoiceCharge[]>> {
    const url = `${URL_SERVICES}/${invoiceId}/charge/import-from-po`;
    return this.http.post<MessageResponse<InvoiceCharge[]>>(url, request, { headers: this.authSV.headers() })
      .pipe(catchError(err => throwError(() => err.error)));
  }

  createInvoiceTax(invoiceId: string, request: InvoiceTaxRequest): Observable<MessageResponse<InvoiceTax>> {
    const url = `${URL_SERVICES}/${invoiceId}/tax`;
    return this.http.post<MessageResponse<InvoiceTax>>(url, request, { headers: this.authSV.headers() })
      .pipe(catchError(err => throwError(() => err.error)));
  }

  updateInvoiceTax(invoiceId: string, taxId: string, request: InvoiceTaxRequest): Observable<MessageResponse<InvoiceTax>> {
    const url = `${URL_SERVICES}/${invoiceId}/tax/${taxId}`;
    return this.http.put<MessageResponse<InvoiceTax>>(url, request, { headers: this.authSV.headers() })
      .pipe(catchError(err => throwError(() => err.error)));
  }

  removeInvoiceTax(invoiceId: string, taxId: string): Observable<MessageResponse<string>> {
    const url = `${URL_SERVICES}/${invoiceId}/tax/${taxId}`;
    return this.http.delete<MessageResponse<string>>(url, { headers: this.authSV.headers() })
      .pipe(catchError(err => throwError(() => err.error)));
  }

  linkInvoicePurchaseOrders(invoiceId: string, request: InvoicePoLinkRequest): Observable<MessageResponse<InvoiceAssociatedPo[]>> {
    const url = `${URL_SERVICES}/${invoiceId}/purchase-order`;
    return this.http.post<MessageResponse<InvoiceAssociatedPo[]>>(url, request, { headers: this.authSV.headers() })
      .pipe(catchError(err => throwError(() => err.error)));
  }

  unlinkInvoicePurchaseOrder(invoiceId: string, poId: string): Observable<MessageResponse<string>> {
    const url = `${URL_SERVICES}/${invoiceId}/purchase-order/${poId}`;
    return this.http.delete<MessageResponse<string>>(url, { headers: this.authSV.headers() })
      .pipe(catchError(err => throwError(() => err.error)));
  }

  //#endregion
}

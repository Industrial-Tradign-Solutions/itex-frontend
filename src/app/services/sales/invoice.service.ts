import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { TypeTab } from '@config/types/tabs';
import { MessageResponse } from '@interfaces/message-response';
import { Page } from '@interfaces/page.model';
import { InvoiceFilter, InvoiceOpenAndLock, ListInvoice } from '@interfaces/sales/invoice';
import { AuthService } from '@services/security';
import { catchError, concatMap, Observable, of, Subject, throwError } from 'rxjs';
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

  //#endregion
}

import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { IpQuoteRequestAvailableForQ, ListIpQuoteRequest } from '@interfaces/ip/quoteRequest';
import { IpQuotationService, IpQuoteRequestService } from '@services/ip';
import { UtilService } from '@services/util';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { environment } from '../../../../../environments/environment';
import { TitlesMessages } from '@config/messages';
import { finalize, map } from 'rxjs';

const TIMEOUT = environment.timeout;
const TITLES = TitlesMessages;

@Component({
  selector: 'app-add-quote-requests-modal',
  templateUrl: './add-quote-requests-modal.component.html',
  styleUrl: './add-quote-requests-modal.component.scss'
})
export class AddQuoteRequestsModalComponent implements OnInit {

  //! Inyecciones
  private config      = inject(DynamicDialogConfig);
  private ref         = inject(DynamicDialogRef);
  private utilSV      = inject(UtilService);
  private qSV         = inject(IpQuotationService);
  private quoteRequestSV  = inject(IpQuoteRequestService);
  //! -----------------------------------------------

  //* Señales
  private _loading = signal<boolean>(true);
  loading = computed<boolean>(() => this._loading());
  qId = computed<string>(() => this.config.data.qId);
  listAdQR = computed<{qqrId?: string, id?: string, number?: string}[]>(() => this.config.data.listAddQR);
  clientId = computed<string>(() => this.config.data.clientId);
  currency = computed<string>(() => this.config.data.currency);
  //*------------------------------------------------
  //? Variables
  viewCompletedQR: boolean = false;
  selectedQR: ListIpQuoteRequest[] = [];
  //?------------------------------------------------------------

  private _listQR = signal<ListIpQuoteRequest[]>([]);
  listQR = computed<ListIpQuoteRequest[]>(() => this._listQR());

  ngOnInit(): void {
    setTimeout(() => this.search(), TIMEOUT);
  }

  onSubmit(): void {
    if (this.selectedQR.length === 0) {
      this.utilSV.setMessage(TITLES.warning, 'Please select at least one Quote Request', 'warn');
      return;
    }

    this._loading.set(true);
    const quoteRequestIds = this.selectedQR.map(qr => qr.id);

    setTimeout(() => {
      this.qSV.addQuoteRequestsToQuotation(this.qId(), { quoteRequestIds })
      .pipe(
        finalize(() => this._loading.set(false))
      )
      .subscribe({
        next: (resp) => {
          this.utilSV.setMessage(resp.title, resp.message, 'success');
          this.ref.close({ valid: true, quotation: resp.data });
        },
        error: (err) => this.utilSV.setMessage(TITLES.error, err, 'error'),
      });
    }, TIMEOUT);
  }

  closeModal() {
    this.ref.close({ valid: false });
  }

  search(): void {
    this._loading.set(true);
    this.quoteRequestSV.getListQuoteRequestByClientAvailableToQuotation(
      this.clientId(),
      this.viewCompletedQR,
      this.currency()
    )
    .pipe(
      finalize(() => this.disableLogin()),
      map((items: ListIpQuoteRequest[]) => {
        const idsExistentes = new Set(this.listAdQR().map(item => item.id));
        const resp: ListIpQuoteRequest[] =  items.filter(item => !idsExistentes.has(item.id));
        return resp;
      })
    )
    .subscribe({
      next: (resp) => {
        this._listQR.set(resp);
      },
      error: (err) => {
        this.utilSV.setMessage(TITLES.error, err, 'error');
      },
    });
  }

  getStatusColor(status: 'CREATED' | 'SENT' | 'REJECTED' | 'ANSWERED' | 'COMPLETE'): string {
    if (status === 'CREATED') {
      return 'new';
    } else if (status === 'REJECTED') {
      return 'unqualified';
    } else if (status === 'SENT') {
      return 'renewal';
    } else if (status === 'ANSWERED') {
      return 'negotiation';
    } else if (status === 'COMPLETE') {
      return 'qualified';
    } else {
      return 'new';
    }
  }

  private disableLogin() {
    setTimeout(() => {
      this._loading.set(false);
    }, TIMEOUT);
  }
}

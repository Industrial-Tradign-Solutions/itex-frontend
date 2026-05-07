import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { IpQuotation } from '@interfaces/ip/quotation';
import { IpQuoteRequestAvailableForQ } from '@interfaces/ip/quoteRequest';
import { IpQuotationService } from '@services/ip';
import { UtilService } from '@services/util';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { environment } from '../../../../../environments/environment';
import { TitlesMessages } from '@config/messages';
import { finalize } from 'rxjs';

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
  //! -----------------------------------------------

  //* Señales
  private _loading = signal<boolean>(true);
  loading = computed<boolean>(() => this._loading());
  qId = computed<string>(() => this.config.data.qId);
  clientId = computed<string>(() => this.config.data.clientId);
  currency = computed<string>(() => this.config.data.currency);
  viewCompletedQr = computed<boolean>(() => this.config.data.viewCompletedQr ?? false);
  //*------------------------------------------------

  private _listAvailableQRs = signal<IpQuoteRequestAvailableForQ[]>([]);
  listAvailableQRs = computed<IpQuoteRequestAvailableForQ[]>(() => this._listAvailableQRs());

  private _selectedQRs = signal<IpQuoteRequestAvailableForQ[]>([]);
  selectedQRs = computed<IpQuoteRequestAvailableForQ[]>(() => this._selectedQRs());

  ngOnInit(): void {
    setTimeout(() => this.loadAvailableQRs(), TIMEOUT);
  }

  onSubmit(): void {
    if (this.selectedQRs().length === 0) {
      this.utilSV.setMessage(TITLES.warning, 'Please select at least one Quote Request', 'warn');
      return;
    }

    this._loading.set(true);
    const quoteRequestIds = this.selectedQRs().map(qr => qr.id);

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

  private loadAvailableQRs(): void {
    this.qSV.getAvailableQuoteRequestsForQuotation(
      this.qId(),
      this.clientId(),
      this.viewCompletedQr(),
      this.currency()
    )
    .pipe(
      finalize(() => this._loading.set(false))
    )
    .subscribe({
      next: (resp) => {
        this._listAvailableQRs.set(resp);
      },
      error: (err) => {
        this.utilSV.setMessage(TITLES.error, err, 'error');
      },
    });
  }

  onSelectionChange(event: any) {
    this._selectedQRs.set(event);
  }
}

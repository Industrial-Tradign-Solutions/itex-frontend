import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AvailableForPurchaseOrder } from '@interfaces/ip/quotation';
import { IpPurchaseOrderService, IpQuotationService } from '@services/ip';
import { UtilService } from '@services/util';
import { TitlesMessages } from '@config/messages';
import { finalize } from 'rxjs';

const TITLES = TitlesMessages;

@Component({
  selector: 'app-change-quotation-modal',
  templateUrl: './change-quotation-modal.component.html',
  styleUrl: './change-quotation-modal.component.scss'
})
export class ChangeQuotationModalComponent implements OnInit {

  private config       = inject(DynamicDialogConfig);
  private ref          = inject(DynamicDialogRef);
  private ipQuotationSV = inject(IpQuotationService);
  private ipPurchaseOrderSV = inject(IpPurchaseOrderService);
  private utilSV        = inject(UtilService);

  private _loading = signal<boolean>(true);
  loading = computed<boolean>(() => this._loading());

  private _listQuotations = signal<AvailableForPurchaseOrder[]>([]);
  listQuotations = computed<AvailableForPurchaseOrder[]>(() => this._listQuotations());

  private _saving = signal<boolean>(false);
  saving = computed<boolean>(() => this._saving());

  poId = computed<string>(() => this.config.data.poId);
  clientId = computed<string>(() => this.config.data.clientId);
  currency = computed<string>(() => this.config.data.currency);
  currentQuotationId = computed<string | null>(() => this.config.data.currentQuotationId ?? null);

  viewCompleted: boolean = false;
  selectedQ: AvailableForPurchaseOrder | null = null;

  ngOnInit(): void {
    this.loadQuotations();
  }

  onFilterChanged(): void {
    this.loadQuotations();
  }

  toggleQSelection(q: AvailableForPurchaseOrder): void {
    this.selectedQ = this.selectedQ?.id === q.id ? null : q;
  }

  private loadQuotations(): void {
    this._loading.set(true);
    this.ipQuotationSV.getQuotationsAvailableForPurchaseOrder(this.clientId(), this.viewCompleted, this.currency())
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: resp => this._listQuotations.set(resp),
        error: err => this.utilSV.setMessage(TITLES.error, err, 'error')
      });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'CREATED':   return 'new';
      case 'REJECTED':  return 'unqualified';
      case 'SENT':      return 'renewal';
      case 'ANSWERED':  return 'negotiation';
      case 'COMPLETE':  return 'qualified';
      default:          return 'new';
    }
  }

  getSupplierDisplay(q: AvailableForPurchaseOrder): string {
    if (!q.suppliers?.length) return '—';
    if (q.suppliers.length === 1) return q.suppliers[0].name;
    return `Multiple (${q.suppliers.length})`;
  }

  changeQuotation(): void {
    if (!this.selectedQ) return;
    this._saving.set(true);
    this.ipPurchaseOrderSV.changeQuotationPurchaseOrder(this.poId(), this.selectedQ.id)
      .pipe(finalize(() => this._saving.set(false)))
      .subscribe({
        next: resp => {
          this.utilSV.setMessage(resp.title, resp.message, 'success');
          this.ref.close({ valid: true, data: { id: this.selectedQ!.id, number: this.selectedQ!.number } });
        },
        error: err => this.utilSV.setMessage(TITLES.error, err, 'error')
      });
  }

  closeModal(): void {
    this.ref.close({ valid: false });
  }
}

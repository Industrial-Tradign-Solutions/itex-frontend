import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { IpPurchaseOrderService } from '@services/ip';
import { UtilService } from '@services/util';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TitlesMessages } from '@config/messages';
import { finalize, Observable } from 'rxjs';
import { AvailableIpPurchaseOrderOtherCharge } from '@interfaces/ip/purchaseOrder';
import { MessageResponse } from '@interfaces/message-response';

const TITLES = TitlesMessages;

type ImportSource = 'quotation' | 'quotation-qr';
type AvailableRow = AvailableIpPurchaseOrderOtherCharge & { selected: boolean };

@Component({
  selector: 'app-po-import-other-charges-modal',
  templateUrl: './po-import-other-charges-modal.component.html',
  styleUrl: './po-import-other-charges-modal.component.scss'
})
export class PoImportOtherChargesModalComponent implements OnInit {

  private config = inject(DynamicDialogConfig);
  private ref    = inject(DynamicDialogRef);
  private utilSV = inject(UtilService);
  private poSV   = inject(IpPurchaseOrderService);

  private _loading = signal<boolean>(true);
  loading = computed<boolean>(() => this._loading());
  private _importing = signal<boolean>(false);
  importing = computed<boolean>(() => this._importing());

  poId = computed<string>(() => this.config.data.poId);
  currency = computed<string>(() => this.config.data.currency);
  source = computed<ImportSource>(() => this.config.data.source);
  // Q# on quotation source, QR# on quotation-qr source (§4.6/§4.10).
  sourceLabel = computed<string>(() => this.source() === 'quotation' ? 'Q #' : 'QR #');

  private _available = signal<AvailableRow[]>([]);
  available = computed<AvailableRow[]>(() => this._available());
  hasSelection = computed<boolean>(() => this._available().some(c => c.selected));

  ngOnInit(): void {
    this.loadAvailable();
  }

  private loadAvailable(): void {
    const source$ = this.source() === 'quotation'
      ? this.poSV.getAvailableChargesFromQuotation(this.poId())
      : this.poSV.getAvailableChargesFromQuotationQr(this.poId());

    source$
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: resp => this._available.set(resp.map(c => ({ ...c, selected: false }))),
        error: err => {
          this.utilSV.setMessage(TITLES.error, err, 'error');
          this.ref.close({ valid: false });
        }
      });
  }

  toggleSelect(id: string): void {
    this._available.update(items =>
      items.map(i => i.id === id ? { ...i, selected: !i.selected } : i)
    );
  }

  importSelected(): void {
    const chargeIds = this._available().filter(c => c.selected).map(c => c.id);
    if (chargeIds.length === 0) return;

    this._importing.set(true);
    const import$: Observable<MessageResponse<unknown>> = this.source() === 'quotation'
      ? this.poSV.importChargesFromQuotation(this.poId(), { chargeIds })
      : this.poSV.importChargesFromQuotationQr(this.poId(), { chargeIds });

    import$
      .pipe(finalize(() => this._importing.set(false)))
      .subscribe({
        next: resp => {
          this.utilSV.setMessage(resp.title, resp.message, 'success');
          this.ref.close({ valid: true });
        },
        error: err => this.utilSV.setMessage(TITLES.error, err, 'error')
      });
  }

  closeModal(): void {
    this.ref.close({ valid: false });
  }
}

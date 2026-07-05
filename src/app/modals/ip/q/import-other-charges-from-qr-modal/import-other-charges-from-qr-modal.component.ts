import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { IpQuotationOtherChargeAvailableFromQr, IpQuotationOtherChargeImportItem } from '@interfaces/ip/quotation';
import { IpQuotationService } from '@services/ip';
import { UtilService } from '@services/util';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { finalize } from 'rxjs';

interface AvailableOtherChargeDisplay extends IpQuotationOtherChargeAvailableFromQr {
  selected: boolean;
}

@Component({
  selector: 'app-import-other-charges-from-qr-modal',
  templateUrl: './import-other-charges-from-qr-modal.component.html',
  styleUrl: './import-other-charges-from-qr-modal.component.scss'
})
export class ImportOtherChargesFromQrModalComponent implements OnInit {

  private config    = inject(DynamicDialogConfig);
  private ref       = inject(DynamicDialogRef);
  private utilSV    = inject(UtilService);
  private qSV       = inject(IpQuotationService);

  protected _loading = signal<boolean>(true);
  loading = computed<boolean>(() => this._loading());
  qId = computed<string>(() => this.config.data.qId);
  currency = computed<string>(() => this.config.data.currency);

  private listQuoteRequests = computed<{qqrId?: string; number?: string}[]>(() => this.config.data.listQuoteRequests || []);

  private qrNumberToQqrId = computed<Map<string, string>>(() => {
    const map = new Map<string, string>();
    for (const qr of this.listQuoteRequests()) {
      if (qr.qqrId && qr.number) {
        map.set(qr.number, qr.qqrId);
      }
    }
    return map;
  });

  protected _availableCharges = signal<AvailableOtherChargeDisplay[]>([]);
  availableCharges = computed<AvailableOtherChargeDisplay[]>(() => this._availableCharges());

  protected _importing = signal<boolean>(false);
  importing = computed<boolean>(() => this._importing());
  hasSelection = computed<boolean>(() => this._availableCharges().some(c => c.selected));

  ngOnInit(): void {
    this.loadAvailableCharges();
  }

  private loadAvailableCharges(): void {
    this.qSV.getAvailableOtherChargesFromQr(this.qId())
      .pipe(
        finalize(() => this._loading.set(false))
      )
      .subscribe({
        next: (resp) => this._availableCharges.set(resp.map(c => ({ ...c, selected: false }))),
        error: (err) => {
          this.utilSV.setMessage('Error', err, 'error');
          this.ref.close({ valid: false });
        }
      });
  }

  toggleSelect(id: string): void {
    this._availableCharges.update(items => {
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) return items;
      const updated = [...items];
      updated[idx] = { ...updated[idx], selected: !updated[idx].selected };
      return updated;
    });
  }

  importSelected(): void {
    const selected = this._availableCharges().filter(c => c.selected);
    if (selected.length === 0) return;

    this._importing.set(true);

    const qrMap = this.qrNumberToQqrId();
    const items: IpQuotationOtherChargeImportItem[] = [];

    for (const charge of selected) {
      const quotationsQuoteRequestId = qrMap.get(charge.qrNumber);
      if (quotationsQuoteRequestId) {
        items.push({
          quotationsQuoteRequestId,
          qrOtherChargeId: charge.id
        });
      }
    }

    if (items.length === 0) {
      this._importing.set(false);
      this.utilSV.setMessage('Error', 'No matching QR found for selected charges', 'error');
      return;
    }

    this.qSV.importOtherChargesFromQr(this.qId(), { items })
      .pipe(
        finalize(() => this._importing.set(false))
      )
      .subscribe({
        next: (resp) => {
          this.utilSV.setMessage(resp.title, resp.message, 'success');
          this.ref.close({ valid: true, data: resp.data });
        },
        error: (err) => this.utilSV.setMessage('Error', err, 'error')
      });
  }

  closeModal(): void {
    this.ref.close({ valid: false });
  }
}

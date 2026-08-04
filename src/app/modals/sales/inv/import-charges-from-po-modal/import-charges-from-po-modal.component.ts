import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { TitlesMessages } from '@config/messages';
import { AvailablePoCharge, InvoiceAssociatedPo } from '@interfaces/sales/invoice';
import { InvoiceService } from '@services/sales';
import { UtilService } from '@services/util';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { finalize } from 'rxjs';
import { environment } from '../../../../../environments/environment';

const TIMEOUT = environment.timeout;
const TITLES  = TitlesMessages;

/**
 * Imports the charges of one linked PO (§12.3).
 *
 * There is no per-line selection: the endpoint takes `{ poId }` and copies
 * every other charge of that PO. §12.4 is only used to show what is about to
 * be imported — its rows carry no charge id.
 */
@Component({
  selector: 'app-import-charges-from-po-modal',
  templateUrl: './import-charges-from-po-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportChargesFromPoModalComponent implements OnInit {

  private config    = inject(DynamicDialogConfig);
  private ref       = inject(DynamicDialogRef);
  private utilSV    = inject(UtilService);
  private invoiceSV = inject(InvoiceService);

  private _loading = signal<boolean>(true);
  loading = computed<boolean>(() => this._loading());

  invoiceId       = computed<string>(() => this.config.data.invoiceId);
  currency        = computed<string>(() => this.config.data.currency ?? 'USD');
  purchaseOrders  = computed<InvoiceAssociatedPo[]>(() => this.config.data.purchaseOrders ?? []);

  private _available = signal<AvailablePoCharge[]>([]);
  private _selectedPoId = signal<string | undefined>(undefined);

  selectedPoId = computed<string | undefined>(() => this._selectedPoId());

  preview = computed<AvailablePoCharge[]>(() =>
    this._available().filter(charge => charge.poId === this._selectedPoId())
  );

  // §12.3 turns this one into a tax record instead of a charge; the warning is
  // only shown when the selected PO actually carries it.
  hasSalesTax = computed<boolean>(() => this.preview().some(charge => charge.source === 'SALES_TAX'));

  canSubmit = computed<boolean>(() => !!this._selectedPoId() && this.preview().length > 0);

  ngOnInit(): void {
    setTimeout(() => this.load(), TIMEOUT);
  }

  selectPo(poId: string): void {
    this._selectedPoId.set(poId);
  }

  onSubmit(): void {
    if (!this.canSubmit()) return;

    this._loading.set(true);
    this.invoiceSV.importChargesFromPo(this.invoiceId(), { poId: this._selectedPoId()! })
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: resp => {
          this.utilSV.setMessage(resp.title, resp.message, 'success');
          this.ref.close({ valid: true, charges: resp.data });
        },
        error: err => this.utilSV.setMessage(TITLES.error, err?.errorMessage ?? err, 'error')
      });
  }

  closeModal(): void {
    this.ref.close({ valid: false });
  }

  private load(): void {
    this.invoiceSV.getAvailablePoCharges(this.invoiceId())
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: resp => {
          this._available.set(resp);
          this._selectedPoId.set(this.purchaseOrders()[0]?.id);
        },
        error: err => this.utilSV.setMessage(TITLES.error, err, 'error')
      });
  }

}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TitlesMessages } from '@config/messages';
import { InvoiceAssociatedPo, InvoiceCharge } from '@interfaces/sales/invoice';
import { InvoiceService } from '@services/sales';
import { UtilService } from '@services/util';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { finalize } from 'rxjs';
import { ImportChargesFromPoModalComponent } from '../import-charges-from-po-modal/import-charges-from-po-modal.component';
import { InvoiceChargeModalComponent } from '../invoice-charge-modal/invoice-charge-modal.component';

const TITLES = TitlesMessages;

/**
 * Charges list of the invoice (§12).
 *
 * Holds its own copy of the list and **replaces** it on every child result —
 * never an in-place mutation of the array received from the parent. The parent
 * only reloads the invoice once, when this closes with `valid: true`, because
 * a charge mutation also moves `chargesTotal` and `totalAmount`.
 */
@Component({
  selector: 'app-list-invoice-charges-modal',
  templateUrl: './list-invoice-charges-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListInvoiceChargesModalComponent {

  private config    = inject(DynamicDialogConfig);
  private ref       = inject(DynamicDialogRef);
  private dialogSV  = inject(DialogService);
  private utilSV    = inject(UtilService);
  private invoiceSV = inject(InvoiceService);

  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());

  invoiceId      = computed<string>(() => this.config.data.invoiceId);
  currency       = computed<string>(() => this.config.data.currency ?? 'USD');
  canEdit        = computed<boolean>(() => this.config.data.canEdit === true);
  purchaseOrders = computed<InvoiceAssociatedPo[]>(() => this.config.data.purchaseOrders ?? []);

  private _charges = signal<InvoiceCharge[]>(this.config.data.charges ?? []);
  charges = computed<InvoiceCharge[]>(() => this._charges());

  // Any successful child mutation already hit the server, so the parent has to
  // reload even if the user closes with "Close".
  private changed = false;

  canImport = computed<boolean>(() => this.canEdit() && this.purchaseOrders().length > 0);

  openChargeModal(type: 'create' | 'edit', charge?: InvoiceCharge): void {
    const modal = this.dialogSV.open(InvoiceChargeModalComponent, {
      header: type === 'edit' ? 'UPDATE CHARGE' : 'ADD CHARGE',
      width: '30rem',
      closable: false,
      closeOnEscape: false,
      data: {
        type,
        charge,
        invoiceId: this.invoiceId(),
        currency: this.currency()
      }
    });

    modal.onClose.subscribe({
      next: (resp: { valid: boolean, charge: InvoiceCharge }) => {
        if (!resp?.valid) return;
        this.changed = true;
        this._charges.set(type === 'create'
          ? [...this._charges(), resp.charge]
          : this._charges().map(item => item.id === resp.charge.id ? resp.charge : item)
        );
      }
    });
  }

  openImportModal(): void {
    const modal = this.dialogSV.open(ImportChargesFromPoModalComponent, {
      header: 'IMPORT CHARGES FROM PO',
      width: '60rem',
      closable: false,
      closeOnEscape: false,
      data: {
        invoiceId: this.invoiceId(),
        currency: this.currency(),
        purchaseOrders: this.purchaseOrders()
      }
    });

    modal.onClose.subscribe({
      next: (resp: { valid: boolean, charges: InvoiceCharge[] }) => {
        if (!resp?.valid) return;
        this.changed = true;
        this._charges.set([...this._charges(), ...(resp.charges ?? [])]);
      }
    });
  }

  removeCharge(charge: InvoiceCharge): void {
    this.utilSV.confirm({
      message: `Are you sure to remove the charge ${charge.description}?`,
      header: TITLES.confirmation,
      accept: () => {
        this._loading.set(true);
        this.invoiceSV.removeInvoiceCharge(this.invoiceId(), charge.id)
          .pipe(finalize(() => this._loading.set(false)))
          .subscribe({
            next: resp => {
              this.utilSV.setMessage(resp.title, resp.message, 'success');
              this.changed = true;
              this._charges.set(this._charges().filter(item => item.id !== charge.id));
            },
            error: err => this.utilSV.setMessage(TITLES.error, err?.errorMessage ?? err, 'error')
          });
      }
    });
  }

  closeModal(): void {
    this.ref.close({ valid: this.changed });
  }

}

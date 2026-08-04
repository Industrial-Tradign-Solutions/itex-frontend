import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TitlesMessages } from '@config/messages';
import { InvoiceTax } from '@interfaces/sales/invoice';
import { InvoiceService } from '@services/sales';
import { UtilService } from '@services/util';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { finalize } from 'rxjs';
import { InvoiceTaxModalComponent } from '../invoice-tax-modal/invoice-tax-modal.component';

const TITLES = TitlesMessages;

/**
 * Taxes list of the invoice (§13). Same shape as the charges list minus the
 * import: §13 has no import endpoint — the only automatic tax is the one the
 * charges import creates out of the PO's `salesTax` (§12.3).
 */
@Component({
  selector: 'app-list-invoice-taxes-modal',
  templateUrl: './list-invoice-taxes-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListInvoiceTaxesModalComponent {

  private config    = inject(DynamicDialogConfig);
  private ref       = inject(DynamicDialogRef);
  private dialogSV  = inject(DialogService);
  private utilSV    = inject(UtilService);
  private invoiceSV = inject(InvoiceService);

  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());

  invoiceId     = computed<string>(() => this.config.data.invoiceId);
  currency      = computed<string>(() => this.config.data.currency ?? 'USD');
  canEdit       = computed<boolean>(() => this.config.data.canEdit === true);
  productsTotal = computed<number>(() => this.config.data.productsTotal ?? 0);

  private _taxes = signal<InvoiceTax[]>(this.config.data.taxes ?? []);
  taxes = computed<InvoiceTax[]>(() => this._taxes());

  private changed = false;

  openTaxModal(type: 'create' | 'edit', tax?: InvoiceTax): void {
    const modal = this.dialogSV.open(InvoiceTaxModalComponent, {
      header: type === 'edit' ? 'UPDATE TAX' : 'ADD TAX',
      width: '35rem',
      closable: false,
      closeOnEscape: false,
      data: {
        type,
        tax,
        invoiceId: this.invoiceId(),
        currency: this.currency(),
        productsTotal: this.productsTotal()
      }
    });

    modal.onClose.subscribe({
      next: (resp: { valid: boolean, tax: InvoiceTax }) => {
        if (!resp?.valid) return;
        this.changed = true;
        this._taxes.set(type === 'create'
          ? [...this._taxes(), resp.tax]
          : this._taxes().map(item => item.id === resp.tax.id ? resp.tax : item)
        );
      }
    });
  }

  removeTax(tax: InvoiceTax): void {
    this.utilSV.confirm({
      message: `Are you sure to remove the tax ${tax.description}?`,
      header: TITLES.confirmation,
      accept: () => {
        this._loading.set(true);
        this.invoiceSV.removeInvoiceTax(this.invoiceId(), tax.id)
          .pipe(finalize(() => this._loading.set(false)))
          .subscribe({
            next: resp => {
              this.utilSV.setMessage(resp.title, resp.message, 'success');
              this.changed = true;
              this._taxes.set(this._taxes().filter(item => item.id !== tax.id));
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

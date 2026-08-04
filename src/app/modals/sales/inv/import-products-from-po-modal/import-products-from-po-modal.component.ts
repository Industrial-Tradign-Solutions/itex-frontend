import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { TitlesMessages } from '@config/messages';
import { AvailablePoProduct } from '@interfaces/sales/invoice';
import { InvoiceService } from '@services/sales';
import { UtilService } from '@services/util';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { concatMap, finalize, from, toArray } from 'rxjs';
import { environment } from '../../../../../environments/environment';

const TIMEOUT = environment.timeout;
const TITLES  = TitlesMessages;

type ImportRow = AvailablePoProduct & {
  selected: boolean;
  disabled: boolean;
};

/**
 * Imports product lines from the linked POs (§11.5 / §11.6).
 *
 * The backend already excludes products present in the invoice, but the same
 * `productId` can still come from more than one PO — picking one has to block
 * its other appearances, because the invoice only accepts a product once
 * (`sales.invoice.product.exist`).
 *
 * Unlike the Quotations equivalent, no row is ever mutated: selection lives in
 * an immutable `Set` and `disabled` is derived, so the two can never drift.
 * Margin and condition are not asked for either — §11.5 copies them from the
 * source Quotation.
 */
@Component({
  selector: 'app-import-products-from-po-modal',
  templateUrl: './import-products-from-po-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportProductsFromPoModalComponent implements OnInit {

  private config    = inject(DynamicDialogConfig);
  private ref       = inject(DynamicDialogRef);
  private utilSV    = inject(UtilService);
  private invoiceSV = inject(InvoiceService);

  private _loading = signal<boolean>(true);
  loading = computed<boolean>(() => this._loading());

  invoiceId = computed<string>(() => this.config.data.invoiceId);
  currency  = computed<string>(() => this.config.data.currency ?? 'USD');

  private _rows     = signal<AvailablePoProduct[]>([]);
  private _selected = signal<ReadonlySet<string>>(new Set());

  private blockedProductIds = computed<ReadonlySet<string>>(() => new Set(
    this._rows()
      .filter(row => this._selected().has(row.poProductId))
      .map(row => row.productId)
  ));

  // Copy before sorting: p-table's row grouping needs the rows ordered by PO,
  // and the raw signal must stay untouched.
  rows = computed<ImportRow[]>(() => [...this._rows()]
    .sort((a, b) => a.poNumber.localeCompare(b.poNumber))
    .map(row => {
      const selected = this._selected().has(row.poProductId);
      return {
        ...row,
        selected,
        disabled: !selected && this.blockedProductIds().has(row.productId)
      };
    })
  );

  canSubmit = computed<boolean>(() => this._selected().size > 0);

  // §11.5 imports one PO at a time, so the selection is grouped by PO and each
  // group becomes its own call.
  private selectionByPo = computed<Map<string, string[]>>(() => this._rows()
    .filter(row => this._selected().has(row.poProductId))
    .reduce(
      (groups, row) => groups.set(row.poId, [...(groups.get(row.poId) ?? []), row.poProductId]),
      new Map<string, string[]>()
    )
  );

  ngOnInit(): void {
    setTimeout(() => this.load(), TIMEOUT);
  }

  toggle(row: ImportRow): void {
    if (row.disabled) return;

    const selected = new Set(this._selected());
    selected.has(row.poProductId)
      ? selected.delete(row.poProductId)
      : selected.add(row.poProductId);

    this._selected.set(selected);
  }

  onSubmit(): void {
    if (!this.canSubmit()) return;

    this._loading.set(true);
    from([...this.selectionByPo()]).pipe(
      concatMap(([poId, poProductIds]) => this.invoiceSV.importProductsFromPo(this.invoiceId(), { poId, poProductIds })),
      toArray(),
      finalize(() => this._loading.set(false))
    ).subscribe({
      next: responses => {
        const last = responses[responses.length - 1];
        this.utilSV.setMessage(last.title, last.message, 'success');
        this.ref.close({ valid: true });
      },
      // A failed PO leaves the previous ones already imported, so the parent
      // still has to reload.
      error: err => {
        this.utilSV.setMessage(TITLES.error, err?.errorMessage ?? err, 'error');
        this.ref.close({ valid: true });
      }
    });
  }

  closeModal(): void {
    this.ref.close({ valid: false });
  }

  private load(): void {
    this.invoiceSV.getAvailablePoProducts(this.invoiceId())
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: resp => this._rows.set(resp),
        error: err => this.utilSV.setMessage(TITLES.error, err, 'error')
      });
  }

}

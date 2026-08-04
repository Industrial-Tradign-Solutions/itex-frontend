import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { TitlesMessages } from '@config/messages';
import { ListIpPurchaseOrder } from '@interfaces/ip/purchaseOrder';
import { InvoiceAssociatedPo } from '@interfaces/sales/invoice';
import { IpPurchaseOrderService } from '@services/ip';
import { InvoiceService } from '@services/sales';
import { UtilService } from '@services/util';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { finalize } from 'rxjs';
import { environment } from '../../../../../environments/environment';

const TIMEOUT = environment.timeout;
const TITLES  = TitlesMessages;
const PAGE_SIZE = 20;

/**
 * Links Purchase Orders to the invoice (§14.1, one call for the whole
 * selection). There is no dedicated "POs available for invoicing" endpoint, so
 * the search reuses the PO list filtered by the invoice's client; the ones
 * already linked are dropped client-side.
 */
@Component({
  selector: 'app-link-purchase-orders-modal',
  templateUrl: './link-purchase-orders-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LinkPurchaseOrdersModalComponent implements OnInit {

  private config    = inject(DynamicDialogConfig);
  private ref       = inject(DynamicDialogRef);
  private utilSV    = inject(UtilService);
  private poSV      = inject(IpPurchaseOrderService);
  private invoiceSV = inject(InvoiceService);

  private _loading = signal<boolean>(true);
  loading = computed<boolean>(() => this._loading());

  invoiceId = computed<string>(() => this.config.data.invoiceId);
  clientId  = computed<string | undefined>(() => this.config.data.clientId);

  private linkedIds = computed<ReadonlySet<string>>(() =>
    new Set((this.config.data.linkedPurchaseOrders as InvoiceAssociatedPo[] ?? []).map(po => po.id))
  );

  private _results = signal<ListIpPurchaseOrder[]>([]);
  // Derived, never stored: a PO linked in another tab meanwhile still gets
  // filtered out on the next search without touching the raw results.
  results = computed<ListIpPurchaseOrder[]>(() =>
    this._results().filter(po => !this.linkedIds().has(po.id))
  );

  number = '';
  selected: ListIpPurchaseOrder[] = [];

  ngOnInit(): void {
    setTimeout(() => this.search(), TIMEOUT);
  }

  search(): void {
    this._loading.set(true);
    this.poSV.listAllPurchaseOrdersPage({ clientId: this.clientId(), number: this.number }, 0, PAGE_SIZE)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: resp => this._results.set(resp.content),
        error: err => this.utilSV.setMessage(TITLES.error, err, 'error')
      });
  }

  onSubmit(): void {
    if (this.selected.length === 0) return;

    this._loading.set(true);
    const poIds = this.selected.map(po => po.id);

    setTimeout(() => {
      this.invoiceSV.linkInvoicePurchaseOrders(this.invoiceId(), { poIds })
        .pipe(finalize(() => this._loading.set(false)))
        .subscribe({
          next: resp => {
            this.utilSV.setMessage(resp.title, resp.message, 'success');
            this.ref.close({ valid: true });
          },
          error: err => this.utilSV.setMessage(TITLES.error, err?.errorMessage ?? err, 'error')
        });
    }, TIMEOUT);
  }

  closeModal(): void {
    this.ref.close({ valid: false });
  }

}

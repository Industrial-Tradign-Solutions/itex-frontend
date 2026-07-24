import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { UtilService } from '@services/util';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { environment } from '../../../../../environments/environment';
import { TitlesMessages } from '@config/messages';
import { IpPurchaseOrderService } from '@services/ip';
import { EligibleIpPurchaseOrderProduct } from '@interfaces/ip/purchaseOrder';
import { finalize } from 'rxjs';

const TIMEOUT = environment.timeout;
const TITLES = TitlesMessages;

type EligibleRowItem = EligibleIpPurchaseOrderProduct & { selected: boolean };

@Component({
  selector: 'app-add-po-product-modal',
  templateUrl: './add-po-product-modal.component.html',
  styleUrl: './add-po-product-modal.component.scss'
})
export class AddPoProductModalComponent implements OnInit {
  private config = inject(DynamicDialogConfig);
  private ref = inject(DynamicDialogRef);
  private utilSV = inject(UtilService);
  private ipPurchaseOrderSV = inject(IpPurchaseOrderService);

  private _loading = signal<boolean>(true);
  loading = computed<boolean>(() => this._loading());

  poId = computed<string>(() => this.config.data.poId);
  currency = computed<string>(() => this.config.data.currency ?? 'USD');

  private _items = signal<EligibleRowItem[]>([]);
  items = computed<EligibleRowItem[]>(() => this._items());

  // §3.1 already excludes products already on the PO, so the whole list is selectable.
  allSelected = computed<boolean>(() => this._items().length > 0 && this._items().every(i => i.selected));
  canSubmit = computed<boolean>(() => this._items().some(i => i.selected));

  ngOnInit(): void {
    setTimeout(() => this.loadAvailable(), TIMEOUT);
  }

  private loadAvailable(): void {
    this.ipPurchaseOrderSV.getAvailableProducts(this.poId())
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: products => this._items.set(products.map(p => ({ ...p, selected: false }))),
        error: err => this.utilSV.setMessage(TITLES.error, err, 'error')
      });
  }

  toggleItem(quotationProductId: string): void {
    this._items.update(items =>
      items.map(i => i.quotationProductId === quotationProductId ? { ...i, selected: !i.selected } : i)
    );
  }

  // 10C: global "Add All" — select/deselect every available product at once.
  toggleAll(): void {
    const next = !this.allSelected();
    this._items.update(items => items.map(i => ({ ...i, selected: next })));
  }

  onSubmit(): void {
    const ids = this._items().filter(i => i.selected).map(i => i.quotationProductId);
    if (ids.length === 0) {
      this.utilSV.setMessage(TITLES.warning, 'Please select at least one product', 'warn');
      return;
    }

    this._loading.set(true);
    setTimeout(() => {
      this.ipPurchaseOrderSV.addProducts(this.poId(), { quotationProductIds: ids })
        .pipe(finalize(() => this._loading.set(false)))
        .subscribe({
          next: resp => {
            this.utilSV.setMessage(resp.title, resp.message, 'success');
            this.ref.close({ valid: true });
          },
          error: err => this.utilSV.setMessage(TITLES.error, err, 'error')
        });
    }, TIMEOUT);
  }

  closeModal(): void {
    this.ref.close({ valid: false });
  }
}

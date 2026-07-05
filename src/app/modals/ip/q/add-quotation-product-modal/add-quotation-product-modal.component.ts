import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { UtilService } from '@services/util';
import { StaticListsService } from '@services/util';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { environment } from '../../../../../environments/environment';
import { Messages, TitlesMessages } from '@config/messages';
import { StaticListItem } from '@interfaces/static-list.model';
import { IpQuotationService } from '@services/ip';
import { IpQuoteRequestService } from '@services/ip/ip-quote-request.service';
import { IpQuotationProduct, IpQuotationProductBulkRequest, BulkProductTableItem } from '@interfaces/ip/quotation';
import { finalize, forkJoin } from 'rxjs';

const TIMEOUT = environment.timeout;
const TITLES = TitlesMessages;

@Component({
  selector: 'app-add-quotation-product-modal',
  templateUrl: './add-quotation-product-modal.component.html',
  styleUrl: './add-quotation-product-modal.component.scss'
})
export class AddQuotationProductModalComponent implements OnInit {
  private config = inject(DynamicDialogConfig);
  private ref = inject(DynamicDialogRef);
  private utilSV = inject(UtilService);
  private staticListSV = inject(StaticListsService);
  private quotationSV = inject(IpQuotationService);
  private qrSV = inject(IpQuoteRequestService);

  listCondition = computed<StaticListItem[]>(() => this.staticListSV.getListIpQuotationProductCondition());

  private _loading = signal<boolean>(true);
  loading = computed<boolean>(() => this._loading());

  private _version = signal(0);

  qId = computed<string>(() => this.config.data.qId);
  currency = computed<string>(() => this.config.data.currency ?? 'USD');

  canSubmit = computed(() => {
    this._version();
    const selected = this._allItems().filter(i => i.selected);
    return selected.length > 0 && selected.every(i => i.profitMargin != null && i.condition != null);
  });
  listQuoteRequests = computed<{ qqrId?: string; id?: string; number?: string }[]>(() => this.config.data.listQuoteRequests ?? []);
  listExistingProducts = computed<IpQuotationProduct[]>(() => this.config.data.existingProducts ?? []);

  private _allItems = signal<BulkProductTableItem[]>([]);

  visibleItems = computed<BulkProductTableItem[]>(() => {
    const existingQrpIds = new Set(this.listExistingProducts().map(p => p.quoteRequestProduct?.id));
    const existingIpProductIds = new Set(this.listExistingProducts().map(p => p.quoteRequestProduct?.ipProduct?.id));

    return this._allItems()
      .filter(item => !existingQrpIds.has(item.quoteRequestProductId) && !existingIpProductIds.has(item.ipProductId))
      .sort((a, b) => a.ipProductId.localeCompare(b.ipProductId));
  });

  ngOnInit(): void {
    setTimeout(() => this.loadQrProducts(), TIMEOUT);
  }

  private loadQrProducts(): void {
    const qrs = this.listQuoteRequests();
    if (qrs.length === 0) {
      this._loading.set(false);
      return;
    }

    const validQrs = qrs.filter(qr => qr.id);
    if (validQrs.length === 0) {
      this._loading.set(false);
      return;
    }

    forkJoin(
      validQrs.map(qr => this.qrSV.getQuoteRequestById(qr.id!))
    ).subscribe({
      next: (responses) => {
        const items: BulkProductTableItem[] = [];
        responses.forEach(qr => {
          const qqrId = validQrs.find(r => r.id === qr.id)?.qqrId ?? '';
          qr.products?.forEach(prod => {
            items.push({
              quoteRequestProductId: prod.id,
              quotationsQuoteRequestId: qqrId,
              qrNumber: qr.number,
              supplierName: qr.supplier?.name ?? '',
              ipProductId: prod.ipProduct?.id ?? '',
              quantity: prod.quantity,
              unitType: prod.unitType,
              description: prod.ipProduct?.description ?? '-',
              clientDescription: prod.ipProduct?.clientDescription ?? '-',
              mfrReference: prod.ipProduct?.mfrReference ?? '-',
              clientReference: prod.ipProduct?.clientReference ?? '-',
              hts: prod.ipProduct?.htsScheduleBNumber?.toString() ?? '',
              dualUse: prod.ipProduct?.dualUse ?? false,
              eccn: prod.ipProduct?.eccn ?? '',
              leadTime: prod.leadTime,
              leadTimeType: prod.leadTimeType,
              unitPrice: prod.unitPrice,
              extendedPrice: prod.extendedPrice,
              selected: false,
              disabled: false,
              profitMargin: null,
              condition: null
            });
          });
        });
        this._allItems.set(items);
        this._loading.set(false);
      },
      error: () => {
        this._loading.set(false);
      }
    });
  }

  toggleItem(quoteRequestProductId: string): void {
    this._allItems.update(items => {
      const idx = items.findIndex(i => i.quoteRequestProductId === quoteRequestProductId);
      if (idx === -1) return items;

      const item = items[idx];
      const newSelected = !item.selected;

      const updated = [...items];
      updated[idx] = {
        ...item,
        selected: newSelected,
        disabled: false,
        profitMargin: newSelected ? item.profitMargin : null,
        condition: newSelected ? item.condition : null
      };

      if (newSelected) {
        updated.forEach((other, oi) => {
          if (oi !== idx && other.ipProductId === item.ipProductId && !other.selected) {
            updated[oi] = { ...other, disabled: true };
          }
        });
      } else {
        const anyOtherSelected = updated.some(
          (o, oi) => oi !== idx && o.selected && o.ipProductId === item.ipProductId
        );
        if (!anyOtherSelected) {
          updated.forEach((other, oi) => {
            if (oi !== idx && other.ipProductId === item.ipProductId) {
              updated[oi] = { ...other, disabled: false };
            }
          });
        }
      }

      return updated;
    });
  }

  onFormChange(): void {
    this._version.update(v => v + 1);
  }

  onSubmit(): void {
    const selectedItems = this._allItems().filter(i => i.selected);

    if (selectedItems.length === 0) {
      this.utilSV.setMessage(TITLES.warning, 'Please select at least one product', 'warn');
      return;
    }

    const invalid = selectedItems.find(i => i.profitMargin === null || i.condition === null);
    if (invalid) {
      this.utilSV.setMessage(TITLES.warning, 'Please fill Margin and Condition for all selected products', 'warn');
      return;
    }

    this._loading.set(true);

    const payload: IpQuotationProductBulkRequest = {
      products: selectedItems.map(i => ({
        quotationsQuoteRequestId: i.quotationsQuoteRequestId,
        quoteRequestProductId: i.quoteRequestProductId,
        profitMargin: (i.profitMargin ?? 0) / 100,
        condition: i.condition!
      }))
    };

    setTimeout(() => {
      this.quotationSV.createQuotationProductsBulk(this.qId(), payload)
        .pipe(finalize(() => this._loading.set(false)))
        .subscribe({
          next: (resp) => {
            this.utilSV.setMessage(resp.title, resp.message, 'success');
            this.ref.close({ valid: true });
          },
          error: (err) => this.utilSV.setMessage(TITLES.error, err, 'error'),
        });
    }, TIMEOUT);
  }

  closeModal(): void {
    this.ref.close({ valid: false });
  }
}

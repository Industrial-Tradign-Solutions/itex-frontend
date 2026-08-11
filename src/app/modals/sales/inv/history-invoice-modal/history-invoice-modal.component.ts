import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { InvoiceHistory, InvoiceHistoryAction } from '@interfaces/sales/invoice';
import { InvoiceService } from '@services/sales';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { finalize } from 'rxjs';

// A diff entry of `data`, flattened so the template can iterate it.
type HistoryChange = {
  key: string;
  old: unknown;
  new: unknown;
};

// Actions whose `data` is a `field -> {old, new}` map. Everything else is a
// snapshot of the affected row and is rendered field by field.
const DIFF_ACTIONS: InvoiceHistoryAction[] = [
  'UPDATE',
  'ISSUE',
  'CANCEL',
  'REVERT_TO_DRAFT',
  'UPDATE_PRODUCT',
  'UPDATE_CHARGE',
  'UPDATE_TAX'
];

const ACTION_LABEL: Record<InvoiceHistoryAction, string> = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  CLONE: 'CLONED',
  ISSUE: 'ISSUED',
  CANCEL: 'CANCELLED',
  REVERT_TO_DRAFT: 'REVERTED TO DRAFT',
  ADD_PRODUCT: 'ADD PRODUCT',
  REMOVE_PRODUCT: 'REMOVE PRODUCT',
  UPDATE_PRODUCT: 'UPDATE PRODUCT',
  ADD_CHARGE: 'ADD CHARGE',
  REMOVE_CHARGE: 'REMOVE CHARGE',
  UPDATE_CHARGE: 'UPDATE CHARGE',
  ADD_TAX: 'ADD TAX',
  REMOVE_TAX: 'REMOVE TAX',
  UPDATE_TAX: 'UPDATE TAX',
  REGISTER_PAYMENT: 'REGISTER PAYMENT',
  VOID_PAYMENT: 'VOID PAYMENT'
};

// Slugs of the global badge stylesheet, grouped by intent: green for what adds,
// red for what removes, amber for lifecycle moves.
const ACTION_BADGE: Record<InvoiceHistoryAction, string> = {
  CREATE: 'proposal',
  CLONE: 'proposal',
  UPDATE: 'new',
  UPDATE_PRODUCT: 'new',
  UPDATE_CHARGE: 'new',
  UPDATE_TAX: 'new',
  ISSUE: 'renewal',
  REVERT_TO_DRAFT: 'renewal',
  ADD_PRODUCT: 'qualified',
  ADD_CHARGE: 'qualified',
  ADD_TAX: 'qualified',
  REGISTER_PAYMENT: 'qualified',
  REMOVE_PRODUCT: 'unqualified',
  REMOVE_CHARGE: 'unqualified',
  REMOVE_TAX: 'unqualified',
  VOID_PAYMENT: 'unqualified',
  CANCEL: 'unqualified'
};

const FIELD_LABEL: Record<string, string> = {
  status: 'Status',
  number: 'Number',
  draftNumber: 'Draft Number',
  client: 'Client',
  clientContact: 'Client Contact',
  salesRep: 'Sales Rep',
  currency: 'Currency',
  incoterms: 'Incoterms',
  paymentTerms: 'Payment Terms',
  via: 'Via',
  orderNumber: 'Order #',
  awbBl: 'AWB / BL',
  packingList: 'Packing List',
  remarks: 'Remarks',
  internalRemarks: 'Internal Remarks',
  shipToName: 'Ship To Name',
  shipToAddress: 'Ship To Address',
  shipToCity: 'Ship To City',
  shipToPhone: 'Ship To Phone',
  shipToContactName: 'Ship To Contact',
  shipToEmail: 'Ship To Email',
  totalAmount: 'Total',
  paidAmount: 'Paid',
  balanceDue: 'Balance Due',
  issuedAt: 'Issued At',
  dueAt: 'Due At',
  partialPaidAt: 'Partially Paid At',
  paidAt: 'Paid At',
  cancelledAt: 'Cancelled At',
  cancelReason: 'Cancel Reason',
  quantity: 'Quantity',
  unitType: 'Unit Type',
  unitPrice: 'Unit Price',
  profitMargin: 'Profit Margin',
  condition: 'Condition',
  leadTime: 'Lead Time',
  leadTimeType: 'Lead Time Type',
  description: 'Description',
  type: 'Type',
  value: 'Value',
  rate: 'Rate',
  taxableBase: 'Taxable Base',
  amount: 'Amount',
  paymentDate: 'Payment Date',
  paymentMethod: 'Payment Method',
  voidedReason: 'Voided Reason'
};

// Never worth showing: internal ids and timestamps of the row itself.
const HIDDEN_FIELDS = ['id', 'createdAt', 'invoiceId', 'productId', 'ipProduct'];

/**
 * Audit log of a single invoice (§7). Read-only.
 *
 * `data` is a dynamic JSON whose shape depends on `action`, so it is normalised
 * here into a flat `HistoryChange[]` and the template renders one layout for
 * diffs and another for snapshots — instead of the per-action `@if` ladder that
 * QR/Q/PO grew, which has to be edited every time the backend adds an action.
 */
@Component({
  selector: 'app-history-invoice-modal',
  templateUrl: './history-invoice-modal.component.html',
  styleUrl: './history-invoice-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryInvoiceModalComponent implements OnInit {

  private config    = inject(DynamicDialogConfig);
  private invoiceSV = inject(InvoiceService);

  private _loading = signal<boolean>(true);
  loading = computed<boolean>(() => this._loading());

  private _history = signal<InvoiceHistory[]>([]);
  history = computed<InvoiceHistory[]>(() => this._history());

  ngOnInit(): void {
    this.invoiceSV.getInvoiceHistory(this.config.data.invoiceId)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: resp => this._history.set(resp ?? []),
        error: () => this._history.set([])
      });
  }

  actionLabel(action: InvoiceHistoryAction): string {
    return ACTION_LABEL[action] ?? action;
  }

  actionBadge(action: InvoiceHistoryAction): string {
    return ACTION_BADGE[action] ?? 'negotiation';
  }

  fieldLabel(key: string): string {
    return FIELD_LABEL[key] ?? key;
  }

  isDiff(action: InvoiceHistoryAction): boolean {
    return DIFF_ACTIONS.includes(action);
  }

  // Both shapes end up here: a `{old, new}` pair keeps both sides, a snapshot
  // value becomes a `new`-only row. The check is per field, not per action,
  // because the backend mixes both inside the same `data` for some actions.
  changes(item: InvoiceHistory): HistoryChange[] {
    return Object.entries(item.data ?? {})
      .filter(([key]) => !HIDDEN_FIELDS.includes(key))
      .map(([key, value]) => {
        const pair = value as { old?: unknown; new?: unknown } | null;
        const isPair = !!pair && typeof pair === 'object' && ('new' in pair || 'old' in pair);

        return isPair
          ? { key, old: this.plain(pair.old), new: this.plain(pair.new) }
          : { key, old: undefined, new: this.plain(value) };
      });
  }

  // Nested refs (client, salesRep, city…) arrive as objects; only their label
  // is worth showing in an audit row.
  private plain(value: unknown): unknown {
    if (value === null || value === undefined) return value;
    if (typeof value !== 'object') return value;

    const record = value as Record<string, unknown>;
    return record['name'] ?? record['fullName'] ?? record['number'] ?? record['description'] ?? JSON.stringify(value);
  }

}

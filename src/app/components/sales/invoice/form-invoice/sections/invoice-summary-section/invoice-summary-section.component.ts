import { ChangeDetectionStrategy, Component, computed, Input, signal } from '@angular/core';
import { Invoice, invoiceStatusBadge, invoiceStatusLabel } from '@interfaces/sales/invoice';

// §6: these four payment terms are conditions of the flow, not a period after
// issuing, so the backend deliberately leaves `dueAt` null for them. Rendering
// that as an empty cell would be indistinguishable from "not issued yet".
const NON_CALCULABLE_TERMS = ['ADVANCED', 'PRIOR_TO_SHIPMENT', 'W_DOCUMENTS', 'TO_BE_AGREED'];

/**
 * Lifecycle summary: status, the dates of the cycle and the flags derived from
 * them. Everything here is server-owned and strictly read-only.
 *
 * No form controls: `status` only moves through the issue/cancel/revert
 * endpoints, and the amounts live in the totals box next to the products, where
 * they belong. Rendering them as disabled inputs suggested an editability that
 * never existed.
 *
 * Numbering (`draftNumber`/`number`) and `department` stay out on purpose: the
 * tab header already carries the number and IP is the only department.
 */
@Component({
  selector: 'app-invoice-summary-section',
  templateUrl: './invoice-summary-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceSummarySectionComponent {

  // Plain @Input mirrored into a signal so the computed below actually
  // recompute: the parent replaces the whole invoice on every reload.
  private _invoice = signal<Invoice | undefined>(undefined);

  @Input() set invoice(value: Invoice | undefined) {
    this._invoice.set(value);
  }

  status = computed<string>(() => invoiceStatusLabel(this._invoice()?.status ?? 'DRAFT'));
  statusBadge = computed<string>(() => invoiceStatusBadge(this._invoice()?.status ?? 'DRAFT'));

  issuedAt = computed<string | null>(() => this._invoice()?.issuedAt ?? null);
  dueAt = computed<string | null>(() => this._invoice()?.dueAt ?? null);
  overdue = computed<boolean>(() => this._invoice()?.overdue === true);
  paidLate = computed<boolean>(() => this._invoice()?.paidLate === true);

  cancelledAt = computed<string | null>(() => this._invoice()?.cancelledAt ?? null);
  cancelReason = computed<string | null>(() => this._invoice()?.cancelReason ?? null);

  // An issued invoice without `dueAt` is not missing data: its payment terms
  // simply cannot produce one until it is agreed with the client.
  dueToBeAgreed = computed<boolean>(() => {
    const invoice = this._invoice();
    if (!invoice || !invoice.issuedAt || invoice.dueAt) return false;
    return !invoice.paymentTerms || NON_CALCULABLE_TERMS.includes(invoice.paymentTerms);
  });

}

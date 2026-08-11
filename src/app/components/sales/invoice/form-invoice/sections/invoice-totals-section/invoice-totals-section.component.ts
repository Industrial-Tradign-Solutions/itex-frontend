import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Read-only totals box next to the products table. Every figure is
 * server-derived (see itex-invoices-api.md "Totales desglosados") — this
 * component only formats what arrives, at 5 decimals, and never recomputes.
 *
 * Charges and taxes double as the entry point to their own lists (§12/§13):
 * they have no table of their own in the form, so the box is where they are
 * managed from. Payments (§16) follow the same pattern, right under the total
 * they are settling.
 */
@Component({
  selector: 'app-invoice-totals-section',
  templateUrl: './invoice-totals-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceTotalsSectionComponent {

  @Input() productsTotal = 0;
  @Input() chargesTotal = 0;
  @Input() taxesTotal = 0;
  @Input() totalAmount = 0;
  @Input() paidAmount = 0;
  @Input() balanceDue = 0;
  @Input() currency = 'USD';

  // Payments only exist once the invoice is issued, so the whole block is
  // hidden in DRAFT rather than shown at zero.
  @Input() showPayments = false;

  @Output() openCharges = new EventEmitter<void>();
  @Output() openTaxes = new EventEmitter<void>();
  @Output() openPayments = new EventEmitter<void>();

}

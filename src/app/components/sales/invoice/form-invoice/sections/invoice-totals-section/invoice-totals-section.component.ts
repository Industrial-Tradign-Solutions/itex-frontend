import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Read-only totals box next to the products table. Every figure is
 * server-derived (see itex-invoices-api.md "Totales desglosados") — this
 * component only formats what arrives, at 5 decimals, and never recomputes.
 *
 * Charges and taxes double as the entry point to their own lists (§12/§13):
 * they have no table of their own in the form, so the box is where they are
 * managed from.
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
  @Input() currency = 'USD';

  @Output() openCharges = new EventEmitter<void>();
  @Output() openTaxes = new EventEmitter<void>();

}

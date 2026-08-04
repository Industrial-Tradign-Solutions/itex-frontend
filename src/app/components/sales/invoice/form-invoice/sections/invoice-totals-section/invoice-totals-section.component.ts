import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Read-only totals box next to the products table. Every figure is
 * server-derived (see itex-invoices-api.md §11 "Totales desglosados") — this
 * component only formats what arrives, at 5 decimals, and never recomputes.
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

}

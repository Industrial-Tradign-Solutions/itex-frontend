import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { InvoiceProduct } from '@interfaces/sales/invoice';

/**
 * IP products table. Rendered by the container only when
 * `department === 'IP'` — the gate lives one level up so this component stays
 * agnostic of department and can be reused as-is if another department ever
 * needs the same table shape.
 */
@Component({
  selector: 'app-invoice-products-section',
  templateUrl: './invoice-products-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceProductsSectionComponent {

  @Input({ required: true }) products: InvoiceProduct[] = [];
  @Input({ required: true }) currency: string = 'USD';
  @Input() canEdit = false;
  @Input() loading = false;

  @Output() editProduct = new EventEmitter<InvoiceProduct>();
  @Output() removeProduct = new EventEmitter<InvoiceProduct>();
  @Output() viewProduct = new EventEmitter<InvoiceProduct>();

}

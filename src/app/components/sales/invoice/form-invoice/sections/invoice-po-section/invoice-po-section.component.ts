import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { InvoiceAssociatedPo } from '@interfaces/sales/invoice';

/**
 * Associated PO's, read from `linkedPurchaseOrders` (t_invoice_ip_po). Unlike
 * Quotations' equivalent table (view-only), this one is functional: it also
 * lets the user detach a PO, per explicit product decision.
 */
@Component({
  selector: 'app-invoice-po-section',
  templateUrl: './invoice-po-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoicePoSectionComponent {

  @Input({ required: true }) purchaseOrders: InvoiceAssociatedPo[] = [];
  @Input() canEdit = false;
  @Input() loading = false;

  @Output() openPo = new EventEmitter<InvoiceAssociatedPo>();
  @Output() removePo = new EventEmitter<InvoiceAssociatedPo>();
  @Output() associatePo = new EventEmitter<void>();

}

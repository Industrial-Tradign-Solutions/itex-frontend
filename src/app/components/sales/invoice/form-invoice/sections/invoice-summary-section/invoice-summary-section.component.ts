import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { StaticListItem } from '@interfaces/static-list.model';
import { Invoice } from '@interfaces/sales/invoice';

/**
 * Read-only summary: lifecycle status, amounts and the dates of the cycle. All
 * of it is server-derived — `status` only moves through the (not yet
 * implemented) issue/cancel/revert actions, never through this form, and the
 * amounts come from products, charges and taxes.
 *
 * Numbering (`draftNumber`/`number`) and `department` are deliberately absent:
 * the tab header already carries the number and IP is the only department.
 */
@Component({
  selector: 'app-invoice-summary-section',
  templateUrl: './invoice-summary-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceSummarySectionComponent {

  @Input({ required: true }) group!: FormGroup;
  @Input({ required: true }) statusList: StaticListItem[] = [];
  @Input() invoice?: Invoice;
  @Input() currency = 'USD';

}

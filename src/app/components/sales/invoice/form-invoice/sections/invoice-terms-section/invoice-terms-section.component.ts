import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BasicUser } from '@interfaces/administration/user';
import { StaticListItem } from '@interfaces/static-list.model';

/**
 * Commercial terms and shipping references. `paymentTerms` and `salesRepId` are
 * rendered always but the container disables them when the user lacks
 * EDIT_PAYMENT_TERMS_INVOICE / CHANGE_SALES_REP_INVOICE — they still travel in
 * the request as an echo of the current value.
 */
@Component({
  selector: 'app-invoice-terms-section',
  templateUrl: './invoice-terms-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceTermsSectionComponent {

  @Input({ required: true }) group!: FormGroup;
  @Input({ required: true }) currencyList: StaticListItem[] = [];
  @Input({ required: true }) incotermsList: StaticListItem[] = [];
  @Input({ required: true }) viaList: StaticListItem[] = [];
  @Input({ required: true }) paymentTermsList: StaticListItem[] = [];
  @Input({ required: true }) employees: BasicUser[] = [];

}

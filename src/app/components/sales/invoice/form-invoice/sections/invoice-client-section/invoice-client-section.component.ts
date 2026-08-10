import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ClientBasic } from '@interfaces/partners/clients';
import { AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { InvoiceContactOption } from '../../form-invoice.component';

/**
 * Client block. Purely presentational: the container owns the client catalog,
 * decides whether changing the client needs a confirmation, and refreshes the
 * contact list of the IP department.
 */
@Component({
  selector: 'app-invoice-client-section',
  templateUrl: './invoice-client-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceClientSectionComponent {

  @Input({ required: true }) group!: FormGroup;
  @Input({ required: true }) clients: ClientBasic[] = [];
  @Input({ required: true }) contacts: InvoiceContactOption[] = [];

  @Output() searchClient = new EventEmitter<AutoCompleteCompleteEvent>();
  @Output() clientSelected = new EventEmitter<AutoCompleteSelectEvent>();
  @Output() clientCleared = new EventEmitter<void>();

}

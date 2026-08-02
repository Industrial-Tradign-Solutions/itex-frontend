import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BasicCity } from '@interfaces/masters/locations/cities';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';

/**
 * Ship-to block. Only editable while the invoice is a DRAFT being updated: on
 * create the backend copies these six fields from the client, so the section
 * renders disabled until the draft exists.
 */
@Component({
  selector: 'app-invoice-shipto-section',
  templateUrl: './invoice-shipto-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceShiptoSectionComponent {

  @Input({ required: true }) group!: FormGroup;
  @Input({ required: true }) cities: BasicCity[] = [];
  @Input() canCopyFromClient = false;

  @Output() searchCity = new EventEmitter<AutoCompleteCompleteEvent>();
  @Output() copyFromClient = new EventEmitter<void>();

}

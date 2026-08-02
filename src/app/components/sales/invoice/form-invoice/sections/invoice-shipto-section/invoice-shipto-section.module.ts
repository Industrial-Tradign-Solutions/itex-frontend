import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { InvoiceShiptoSectionComponent } from './invoice-shipto-section.component';

@NgModule({
  declarations: [
    InvoiceShiptoSectionComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AutoCompleteModule,
    ButtonModule,
    FloatLabelModule,
    InputTextModule,
    TooltipModule
  ],
  exports: [
    InvoiceShiptoSectionComponent
  ]
})
export class InvoiceShiptoSectionModule { }

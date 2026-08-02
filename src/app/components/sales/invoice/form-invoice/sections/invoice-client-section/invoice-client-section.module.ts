import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DropdownModule } from 'primeng/dropdown';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { InvoiceClientSectionComponent } from './invoice-client-section.component';

@NgModule({
  declarations: [
    InvoiceClientSectionComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AutoCompleteModule,
    DropdownModule,
    FloatLabelModule,
    InputTextModule
  ],
  exports: [
    InvoiceClientSectionComponent
  ]
})
export class InvoiceClientSectionModule { }

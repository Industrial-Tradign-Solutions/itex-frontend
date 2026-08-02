import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InvoiceSummarySectionComponent } from './invoice-summary-section.component';

@NgModule({
  declarations: [
    InvoiceSummarySectionComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DropdownModule,
    FloatLabelModule,
    InputNumberModule
  ],
  exports: [
    InvoiceSummarySectionComponent
  ]
})
export class InvoiceSummarySectionModule { }

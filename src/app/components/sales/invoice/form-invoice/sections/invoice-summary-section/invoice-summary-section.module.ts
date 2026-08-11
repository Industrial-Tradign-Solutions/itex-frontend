import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceSummarySectionComponent } from './invoice-summary-section.component';

@NgModule({
  declarations: [
    InvoiceSummarySectionComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    InvoiceSummarySectionComponent
  ]
})
export class InvoiceSummarySectionModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { TabViewModule } from 'primeng/tabview';
import { InvoiceClientSectionModule } from './sections/invoice-client-section/invoice-client-section.module';
import { InvoiceSummarySectionModule } from './sections/invoice-summary-section/invoice-summary-section.module';
import { InvoiceShiptoSectionModule } from './sections/invoice-shipto-section/invoice-shipto-section.module';
import { InvoiceTermsSectionModule } from './sections/invoice-terms-section/invoice-terms-section.module';
import { FormInvoiceComponent } from './form-invoice.component';

@NgModule({
  declarations: [
    FormInvoiceComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextareaModule,
    MessageModule,
    ProgressBarModule,
    TabViewModule,
    InvoiceClientSectionModule,
    InvoiceSummarySectionModule,
    InvoiceShiptoSectionModule,
    InvoiceTermsSectionModule
  ],
  exports: [
    FormInvoiceComponent
  ]
})
export class FormInvoiceModule { }

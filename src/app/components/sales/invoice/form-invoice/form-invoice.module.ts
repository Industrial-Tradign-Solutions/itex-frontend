import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { TabViewModule } from 'primeng/tabview';
import { InvoiceClientSectionModule } from './sections/invoice-client-section/invoice-client-section.module';
import { InvoiceSummarySectionModule } from './sections/invoice-summary-section/invoice-summary-section.module';
import { InvoiceShiptoSectionModule } from './sections/invoice-shipto-section/invoice-shipto-section.module';
import { InvoiceTermsSectionModule } from './sections/invoice-terms-section/invoice-terms-section.module';
import { InvoiceProductsSectionModule } from './sections/invoice-products-section/invoice-products-section.module';
import { InvoiceTotalsSectionModule } from './sections/invoice-totals-section/invoice-totals-section.module';
import { InvoicePoSectionModule } from './sections/invoice-po-section/invoice-po-section.module';
import { InvoiceAddProductModalModule } from './modals/invoice-add-product-modal/invoice-add-product-modal.module';
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
    DialogModule,
    InputTextModule,
    InputTextareaModule,
    MessageModule,
    ProgressBarModule,
    TabViewModule,
    InvoiceClientSectionModule,
    InvoiceSummarySectionModule,
    InvoiceShiptoSectionModule,
    InvoiceTermsSectionModule,
    InvoiceProductsSectionModule,
    InvoiceTotalsSectionModule,
    InvoicePoSectionModule,
    InvoiceAddProductModalModule
  ],
  exports: [
    FormInvoiceComponent
  ]
})
export class FormInvoiceModule { }

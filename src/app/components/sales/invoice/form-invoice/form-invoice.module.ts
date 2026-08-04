import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ImportProductsFromPoModalModule } from '@modals/sales/inv/import-products-from-po-modal/import-products-from-po-modal.module';
import { InvoiceChargesModule } from '@modals/sales/inv/invoice-charges/invoice-charges.module';
import { InvoiceProductModalModule } from '@modals/sales/inv/invoice-product-modal/invoice-product-modal.module';
import { InvoiceTaxesModule } from '@modals/sales/inv/invoice-taxes/invoice-taxes.module';
import { LinkPurchaseOrdersModalModule } from '@modals/sales/inv/link-purchase-orders-modal/link-purchase-orders-modal.module';
import { ButtonModule } from 'primeng/button';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { TabViewModule } from 'primeng/tabview';
import { FormInvoiceComponent } from './form-invoice.component';
import { InvoiceClientSectionModule } from './sections/invoice-client-section/invoice-client-section.module';
import { InvoicePoSectionModule } from './sections/invoice-po-section/invoice-po-section.module';
import { InvoiceProductsSectionModule } from './sections/invoice-products-section/invoice-products-section.module';
import { InvoiceShiptoSectionModule } from './sections/invoice-shipto-section/invoice-shipto-section.module';
import { InvoiceSummarySectionModule } from './sections/invoice-summary-section/invoice-summary-section.module';
import { InvoiceTermsSectionModule } from './sections/invoice-terms-section/invoice-terms-section.module';
import { InvoiceTotalsSectionModule } from './sections/invoice-totals-section/invoice-totals-section.module';

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
    InvoiceTermsSectionModule,
    InvoiceProductsSectionModule,
    InvoiceTotalsSectionModule,
    InvoicePoSectionModule,
    InvoiceProductModalModule,
    ImportProductsFromPoModalModule,
    LinkPurchaseOrdersModalModule,
    InvoiceChargesModule,
    InvoiceTaxesModule
  ],
  exports: [
    FormInvoiceComponent
  ]
})
export class FormInvoiceModule { }

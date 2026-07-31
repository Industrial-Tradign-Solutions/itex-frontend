import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { TabViewModule } from 'primeng/tabview';
import { OpenCloseConfirmationModalModule } from '@modals/util/open-close-confirmation-modal/open-close-confirmation-modal.module';
import { ListInvoiceModule } from '@components/sales/invoice/list-invoice/list-invoice.module';
import { FormInvoiceModule } from '@components/sales/invoice/form-invoice/form-invoice.module';

import { InvoicesRoutingModule } from './invoices-routing.module';
import { InvoicesComponent } from './invoices.component';


@NgModule({
  declarations: [
    InvoicesComponent
  ],
  imports: [
    CommonModule,
    InvoicesRoutingModule,
    TabViewModule,
    SkeletonModule,
    OpenCloseConfirmationModalModule,
    ListInvoiceModule,
    FormInvoiceModule
  ]
})
export class InvoicesModule { }

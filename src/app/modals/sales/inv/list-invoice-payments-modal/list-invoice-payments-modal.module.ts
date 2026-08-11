import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { PipesModule } from '@pipes/pipes.module';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { InvoiceReasonModalModule } from '../invoice-reason-modal/invoice-reason-modal.module';
import { RegisterPaymentModalModule } from '../register-payment-modal/register-payment-modal.module';
import { ListInvoicePaymentsModalComponent } from './list-invoice-payments-modal.component';

@NgModule({
  declarations: [
    ListInvoicePaymentsModalComponent
  ],
  imports: [
    CommonModule,
    PipesModule,
    ButtonModule,
    TableModule,
    TooltipModule,
    InvoiceReasonModalModule,
    RegisterPaymentModalModule
  ],
  exports: [
    ListInvoicePaymentsModalComponent
  ]
})
export class ListInvoicePaymentsModalModule { }

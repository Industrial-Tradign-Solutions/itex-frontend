import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TableModule } from 'primeng/table';
import { HistoryInvoiceModalComponent } from './history-invoice-modal.component';

@NgModule({
  declarations: [
    HistoryInvoiceModalComponent
  ],
  imports: [
    CommonModule,
    TableModule
  ],
  exports: [
    HistoryInvoiceModalComponent
  ]
})
export class HistoryInvoiceModalModule { }

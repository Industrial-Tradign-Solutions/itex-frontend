import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistoryQuotationModalComponent } from './history-quotation-modal.component';
import { TableModule } from 'primeng/table';

@NgModule({
  declarations: [
    HistoryQuotationModalComponent
  ],
  imports: [
    CommonModule,
    TableModule
  ],
  exports: [
    HistoryQuotationModalComponent
  ]
})
export class HistoryQuotationModalModule { }

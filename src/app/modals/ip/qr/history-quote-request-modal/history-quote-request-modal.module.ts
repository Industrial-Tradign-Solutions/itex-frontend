import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistoryQuoteRequestModalComponent } from './history-quote-request-modal.component';
import { TableModule } from 'primeng/table';

@NgModule({
  declarations: [
    HistoryQuoteRequestModalComponent
  ],
  imports: [
    CommonModule,
    TableModule
  ],
  exports: [
    HistoryQuoteRequestModalComponent
  ]
})
export class HistoryQuoteRequestModalModule { }

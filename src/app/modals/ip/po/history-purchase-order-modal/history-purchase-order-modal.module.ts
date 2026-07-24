import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistoryPurchaseOrderModalComponent } from './history-purchase-order-modal.component';
import { TableModule } from 'primeng/table';

@NgModule({
  declarations: [
    HistoryPurchaseOrderModalComponent
  ],
  imports: [
    CommonModule,
    TableModule
  ],
  exports: [
    HistoryPurchaseOrderModalComponent
  ]
})
export class HistoryPurchaseOrderModalModule { }

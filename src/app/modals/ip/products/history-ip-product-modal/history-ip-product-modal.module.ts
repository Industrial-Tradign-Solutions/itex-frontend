import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistoryIpProductModalComponent } from './history-ip-product-modal.component';
import { TableModule } from 'primeng/table';



@NgModule({
  declarations: [
    HistoryIpProductModalComponent
  ],
  imports: [
    CommonModule,
    TableModule
  ],
  exports: [
    HistoryIpProductModalComponent
  ]
})
export class HistoryIpProductModalModule { }

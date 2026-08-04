import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { LinkPurchaseOrdersModalComponent } from './link-purchase-orders-modal.component';

@NgModule({
  declarations: [
    LinkPurchaseOrdersModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ProgressBarModule,
    ButtonModule,
    InputTextModule,
    TableModule
  ],
  exports: [
    LinkPurchaseOrdersModalComponent
  ]
})
export class LinkPurchaseOrdersModalModule { }

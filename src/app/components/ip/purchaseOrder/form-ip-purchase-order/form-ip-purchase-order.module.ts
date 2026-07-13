import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormIpPurchaseOrderComponent } from './form-ip-purchase-order.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    FormIpPurchaseOrderComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    FormIpPurchaseOrderComponent
  ]
})
export class FormIpPurchaseOrderModule { }

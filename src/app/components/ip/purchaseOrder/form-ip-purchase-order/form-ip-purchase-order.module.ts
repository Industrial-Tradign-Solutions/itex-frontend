import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormIpPurchaseOrderComponent } from './form-ip-purchase-order.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProgressBarModule } from 'primeng/progressbar';
import { FieldsetModule } from 'primeng/fieldset';

@NgModule({
  declarations: [
    FormIpPurchaseOrderComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ProgressBarModule,
    FieldsetModule
  ],
  exports: [
    FormIpPurchaseOrderComponent
  ]
})
export class FormIpPurchaseOrderModule { }

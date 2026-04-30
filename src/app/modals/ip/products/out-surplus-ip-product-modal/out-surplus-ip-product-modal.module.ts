import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OutSurplusIpProductModalComponent } from './out-surplus-ip-product-modal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';



@NgModule({
  declarations: [
    OutSurplusIpProductModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputNumberModule,
    ButtonModule
  ],
  exports: [
    OutSurplusIpProductModalComponent
  ]
})
export class OutSurplusIpProductModalModule { }

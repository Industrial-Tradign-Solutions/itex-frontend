import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddSurplusIpProductModalComponent } from './add-surplus-ip-product-modal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';



@NgModule({
  declarations: [
    AddSurplusIpProductModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule
  ],
  exports: [
    AddSurplusIpProductModalComponent
  ]
})
export class AddSurplusIpProductModalModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubstituteIpProductModalComponent } from './substitute-ip-product-modal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';



@NgModule({
  declarations: [
    SubstituteIpProductModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AutoCompleteModule,
    ButtonModule
  ],
  exports: [
    SubstituteIpProductModalComponent
  ]
})
export class SubstituteIpProductModalModule { }

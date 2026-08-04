import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { InvoiceAddProductModalComponent } from './invoice-add-product-modal.component';

@NgModule({
  declarations: [
    InvoiceAddProductModalComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AutoCompleteModule,
    ButtonModule,
    FloatLabelModule,
    InputTextModule
  ],
  exports: [
    InvoiceAddProductModalComponent
  ]
})
export class InvoiceAddProductModalModule { }

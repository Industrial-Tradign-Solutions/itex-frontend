import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { InvoiceProductModalComponent } from './invoice-product-modal.component';

@NgModule({
  declarations: [
    InvoiceProductModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ProgressBarModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    InputNumberModule,
    AutoCompleteModule
  ],
  exports: [
    InvoiceProductModalComponent
  ]
})
export class InvoiceProductModalModule { }

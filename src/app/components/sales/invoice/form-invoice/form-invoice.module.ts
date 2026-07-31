import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { FormInvoiceComponent } from './form-invoice.component';

@NgModule({
  declarations: [
    FormInvoiceComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MessageModule,
    ProgressBarModule
  ],
  exports: [
    FormInvoiceComponent
  ]
})
export class FormInvoiceModule { }

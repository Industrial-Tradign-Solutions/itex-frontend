import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MessageModule } from 'primeng/message';
import { InvoiceReasonModalComponent } from './invoice-reason-modal.component';

@NgModule({
  declarations: [
    InvoiceReasonModalComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextareaModule,
    MessageModule
  ],
  exports: [
    InvoiceReasonModalComponent
  ]
})
export class InvoiceReasonModalModule { }

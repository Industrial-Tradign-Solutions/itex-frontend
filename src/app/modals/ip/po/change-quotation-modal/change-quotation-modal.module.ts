import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChangeQuotationModalComponent } from './change-quotation-modal.component';
import { ProgressBarModule } from 'primeng/progressbar';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { TableModule } from 'primeng/table';

@NgModule({
  declarations: [
    ChangeQuotationModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ProgressBarModule,
    ButtonModule,
    RadioButtonModule,
    CheckboxModule,
    TableModule
  ],
  exports: [
    ChangeQuotationModalComponent
  ]
})
export class ChangeQuotationModalModule { }

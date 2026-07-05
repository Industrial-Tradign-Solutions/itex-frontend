import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddQuotationProductModalComponent } from './add-quotation-product-modal.component';
import { FormsModule } from '@angular/forms';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';

@NgModule({
  declarations: [
    AddQuotationProductModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ProgressBarModule,
    ButtonModule,
    DropdownModule,
    InputNumberModule,
    TableModule,
    CheckboxModule
  ],
  exports: [
    AddQuotationProductModalComponent
  ]
})
export class AddQuotationProductModalModule { }

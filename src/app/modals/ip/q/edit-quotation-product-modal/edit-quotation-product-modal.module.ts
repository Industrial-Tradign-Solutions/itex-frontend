import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditQuotationProductModalComponent } from './edit-quotation-product-modal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';

@NgModule({
  declarations: [
    EditQuotationProductModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ProgressBarModule,
    ButtonModule,
    DropdownModule,
    InputNumberModule
  ],
  exports: [
    EditQuotationProductModalComponent
  ]
})
export class EditQuotationProductModalModule { }

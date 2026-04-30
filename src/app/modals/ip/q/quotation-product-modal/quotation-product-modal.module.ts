import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuotationProductModalComponent } from './quotation-product-modal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';

@NgModule({
  declarations: [
    QuotationProductModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ProgressBarModule,
    ButtonModule,
    TooltipModule,
    DropdownModule,
    InputNumberModule,
    ProgressSpinnerModule,
    DialogModule
  ],
  exports: [
    QuotationProductModalComponent
  ]
})
export class QuotationProductModalModule { }

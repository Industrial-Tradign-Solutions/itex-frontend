import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewQuotationModalComponent } from './new-quotation-modal.component';
import { ProgressBarModule } from 'primeng/progressbar';
import { FloatLabelModule } from 'primeng/floatlabel';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';

@NgModule({
  declarations: [
    NewQuotationModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ProgressBarModule,
    FloatLabelModule,
    AutoCompleteModule,
    FormsModule,
    CheckboxModule,
    ButtonModule,
    TableModule,
    DropdownModule
],
  exports: [
    NewQuotationModalComponent
  ]
})
export class NewQuotationModalModule { }

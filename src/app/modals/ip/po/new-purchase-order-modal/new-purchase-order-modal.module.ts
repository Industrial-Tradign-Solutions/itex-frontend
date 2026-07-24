import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewPurchaseOrderModalComponent } from './new-purchase-order-modal.component';
import { ProgressBarModule } from 'primeng/progressbar';
import { FloatLabelModule } from 'primeng/floatlabel';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { TableModule } from 'primeng/table';

@NgModule({
  declarations: [
    NewPurchaseOrderModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ProgressBarModule,
    FloatLabelModule,
    AutoCompleteModule,
    ButtonModule,
    DropdownModule,
    RadioButtonModule,
    CheckboxModule,
    TableModule
  ],
  exports: [
    NewPurchaseOrderModalComponent
  ]
})
export class NewPurchaseOrderModalModule { }

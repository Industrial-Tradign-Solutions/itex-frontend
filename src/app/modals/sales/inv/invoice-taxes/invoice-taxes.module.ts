import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PipesModule } from '@pipes/pipes.module';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { InvoiceTaxModalComponent } from '../invoice-tax-modal/invoice-tax-modal.component';
import { ListInvoiceTaxesModalComponent } from '../list-invoice-taxes-modal/list-invoice-taxes-modal.component';

@NgModule({
  declarations: [
    ListInvoiceTaxesModalComponent,
    InvoiceTaxModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PipesModule,
    ProgressBarModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    TableModule,
    TooltipModule
  ],
  exports: [
    ListInvoiceTaxesModalComponent,
    InvoiceTaxModalComponent
  ]
})
export class InvoiceTaxesModule { }

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PipesModule } from '@pipes/pipes.module';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ImportChargesFromPoModalComponent } from '../import-charges-from-po-modal/import-charges-from-po-modal.component';
import { InvoiceChargeModalComponent } from '../invoice-charge-modal/invoice-charge-modal.component';
import { ListInvoiceChargesModalComponent } from '../list-invoice-charges-modal/list-invoice-charges-modal.component';

@NgModule({
  declarations: [
    ListInvoiceChargesModalComponent,
    InvoiceChargeModalComponent,
    ImportChargesFromPoModalComponent
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
    TooltipModule,
    MessageModule,
    MessagesModule
  ],
  exports: [
    ListInvoiceChargesModalComponent,
    InvoiceChargeModalComponent,
    ImportChargesFromPoModalComponent
  ]
})
export class InvoiceChargesModule { }

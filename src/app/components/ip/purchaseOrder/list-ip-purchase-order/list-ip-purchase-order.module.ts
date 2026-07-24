import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListIpPurchaseOrderComponent } from './list-ip-purchase-order.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FieldsetModule } from 'primeng/fieldset';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { FloatLabelModule } from 'primeng/floatlabel';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CalendarModule } from 'primeng/calendar';
import { NewPurchaseOrderModalModule } from '@modals/ip/po/new-purchase-order-modal/new-purchase-order-modal.module';

@NgModule({
  declarations: [
    ListIpPurchaseOrderComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FieldsetModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    DropdownModule,
    FloatLabelModule,
    PaginatorModule,
    TableModule,
    AutoCompleteModule,
    RadioButtonModule,
    CalendarModule,
    NewPurchaseOrderModalModule
  ],
  exports: [
    ListIpPurchaseOrderComponent
  ]
})
export class ListIpPurchaseOrderModule { }

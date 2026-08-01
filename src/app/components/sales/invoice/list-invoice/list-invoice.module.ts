import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { FieldsetModule } from 'primeng/fieldset';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { PipesModule } from '@pipes/pipes.module';
import { ListInvoiceComponent } from './list-invoice.component';

@NgModule({
  declarations: [
    ListInvoiceComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    AutoCompleteModule,
    ButtonModule,
    CalendarModule,
    CheckboxModule,
    DropdownModule,
    FieldsetModule,
    FloatLabelModule,
    InputTextModule,
    PaginatorModule,
    RadioButtonModule,
    TableModule,
    TooltipModule,
    PipesModule
  ],
  exports: [
    ListInvoiceComponent
  ]
})
export class ListInvoiceModule { }

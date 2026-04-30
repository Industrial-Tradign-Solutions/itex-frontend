import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListIpQuoteRequestComponent } from './list-ip-quote-request.component';
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


@NgModule({
  declarations: [
    ListIpQuoteRequestComponent
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
    CalendarModule
  ],
  exports: [
    ListIpQuoteRequestComponent
  ]
})
export class ListIpQuoteRequestModule { }

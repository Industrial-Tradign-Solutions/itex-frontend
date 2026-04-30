import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListClientsComponent } from './list-clients.component';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FieldsetModule } from 'primeng/fieldset';
import { AutoCompleteModule } from 'primeng/autocomplete';



@NgModule({
  declarations: [
    ListClientsComponent
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
    AutoCompleteModule
  ],
  exports: [
    ListClientsComponent
  ]
})
export class ListClientsModule { }

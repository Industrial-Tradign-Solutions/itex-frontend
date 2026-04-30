import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListIpProductsComponent } from './list-ip-products.component';
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
import { InputNumberModule } from 'primeng/inputnumber';



@NgModule({
  declarations: [
    ListIpProductsComponent
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
    InputNumberModule
  ],
  exports: [
    ListIpProductsComponent
  ]
})
export class ListIpProductsModule { }

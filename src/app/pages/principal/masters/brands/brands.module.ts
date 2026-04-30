import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BrandsRoutingModule } from './brands-routing.module';
import { BrandsComponent } from './brands.component';
import { FieldsetModule } from 'primeng/fieldset';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { BrandModalModule } from '@modals/masters/brand-modal/brand-modal.module';
import { ImportExcelBrandModalModule } from '@modals/masters/import-excel-brand-modal/import-excel-brand-modal.module';
import { TooltipModule } from 'primeng/tooltip';
import { ViewBrandSuppliersModalModule } from '@modals/masters/view-brand-suppliers-modal/view-brand-suppliers-modal.module';


@NgModule({
  declarations: [
    BrandsComponent
  ],
  imports: [
    CommonModule,
    BrandsRoutingModule,
    BrandModalModule,
    ImportExcelBrandModalModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    FloatLabelModule,
    TableModule,
    PaginatorModule,
    FieldsetModule,
    TooltipModule,
    ViewBrandSuppliersModalModule
  ]
})
export class BrandsModule{ }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewBrandSuppliersModalComponent } from './view-brand-suppliers-modal.component';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    ViewBrandSuppliersModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    AutoCompleteModule
  ],
  exports: [
    ViewBrandSuppliersModalComponent
  ]
})
export class ViewBrandSuppliersModalModule { }

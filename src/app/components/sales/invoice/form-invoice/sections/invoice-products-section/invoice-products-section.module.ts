import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { PipesModule } from '@pipes/pipes.module';
import { InvoiceProductsSectionComponent } from './invoice-products-section.component';

@NgModule({
  declarations: [
    InvoiceProductsSectionComponent
  ],
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    TooltipModule,
    PipesModule
  ],
  exports: [
    InvoiceProductsSectionComponent
  ]
})
export class InvoiceProductsSectionModule { }

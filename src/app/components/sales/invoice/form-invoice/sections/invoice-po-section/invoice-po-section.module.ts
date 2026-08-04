import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { InvoicePoSectionComponent } from './invoice-po-section.component';

@NgModule({
  declarations: [
    InvoicePoSectionComponent
  ],
  imports: [
    CommonModule,
    ButtonModule,
    ScrollPanelModule,
    TableModule,
    TooltipModule
  ],
  exports: [
    InvoicePoSectionComponent
  ]
})
export class InvoicePoSectionModule { }

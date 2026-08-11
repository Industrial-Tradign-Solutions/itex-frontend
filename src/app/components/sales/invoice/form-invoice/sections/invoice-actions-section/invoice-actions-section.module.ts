import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InvoiceActionsSectionComponent } from './invoice-actions-section.component';

@NgModule({
  declarations: [
    InvoiceActionsSectionComponent
  ],
  imports: [
    CommonModule,
    ButtonModule,
    TooltipModule
  ],
  exports: [
    InvoiceActionsSectionComponent
  ]
})
export class InvoiceActionsSectionModule { }

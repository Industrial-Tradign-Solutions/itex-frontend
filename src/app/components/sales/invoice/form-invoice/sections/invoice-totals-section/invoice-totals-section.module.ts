import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { InvoiceTotalsSectionComponent } from './invoice-totals-section.component';

@NgModule({
  declarations: [
    InvoiceTotalsSectionComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    FloatLabelModule,
    InputNumberModule,
    ButtonModule,
    TooltipModule
  ],
  exports: [
    InvoiceTotalsSectionComponent
  ]
})
export class InvoiceTotalsSectionModule { }

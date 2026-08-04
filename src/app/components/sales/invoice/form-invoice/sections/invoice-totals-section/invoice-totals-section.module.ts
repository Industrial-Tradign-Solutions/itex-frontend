import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InvoiceTotalsSectionComponent } from './invoice-totals-section.component';

@NgModule({
  declarations: [
    InvoiceTotalsSectionComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    FloatLabelModule,
    InputNumberModule
  ],
  exports: [
    InvoiceTotalsSectionComponent
  ]
})
export class InvoiceTotalsSectionModule { }

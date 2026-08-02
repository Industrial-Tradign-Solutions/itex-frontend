import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { InvoiceTermsSectionComponent } from './invoice-terms-section.component';

@NgModule({
  declarations: [
    InvoiceTermsSectionComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DropdownModule,
    FloatLabelModule,
    InputTextModule
  ],
  exports: [
    InvoiceTermsSectionComponent
  ]
})
export class InvoiceTermsSectionModule { }

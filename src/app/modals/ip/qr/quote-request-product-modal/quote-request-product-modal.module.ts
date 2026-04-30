import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuoteRequestProductModalComponent } from './quote-request-product-modal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { AutoCompleteModule } from 'primeng/autocomplete';

@NgModule({
  declarations: [
    QuoteRequestProductModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ProgressBarModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    DropdownModule,
    InputNumberModule,
    AutoCompleteModule
  ],
  exports: [
    QuoteRequestProductModalComponent
  ]
})
export class QuoteRequestProductModalModule { }

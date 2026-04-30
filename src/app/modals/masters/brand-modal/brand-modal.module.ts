import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrandModalComponent } from './brand-modal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { AutoCompleteModule } from 'primeng/autocomplete';



@NgModule({
  declarations: [
    BrandModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    ProgressBarModule,
    AutoCompleteModule
  ],
  exports: [
    BrandModalComponent
  ]
})
export class BrandModalModule { }

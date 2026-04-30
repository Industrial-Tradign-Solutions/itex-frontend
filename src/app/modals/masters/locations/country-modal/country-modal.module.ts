import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { InputTextModule } from 'primeng/inputtext';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CountryModalComponent } from './country-modal.component';



@NgModule({
  declarations: [
    CountryModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DynamicDialogModule,
    InputTextModule,
    ProgressBarModule,
    ButtonModule
  ],
  exports: [
    CountryModalComponent
  ]
})
export class CountryModalModule { }

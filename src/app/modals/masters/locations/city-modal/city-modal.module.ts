import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CityModalComponent } from './city-modal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';



@NgModule({
  declarations: [
    CityModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DynamicDialogModule,
    InputTextModule,
    ProgressBarModule,
    ButtonModule,
    DropdownModule
  ],
  exports: [
    CityModalComponent
  ]
})
export class CityModalModule { }

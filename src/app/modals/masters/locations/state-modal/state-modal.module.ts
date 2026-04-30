import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StateModalComponent } from './state-modal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';


@NgModule({
  declarations: [
    StateModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DynamicDialogModule,
    InputTextModule,
    ProgressBarModule,
    ButtonModule,
    DropdownModule,
    CheckboxModule
  ],
  exports: [
    StateModalComponent
  ]
})
export class StateModalModule { }

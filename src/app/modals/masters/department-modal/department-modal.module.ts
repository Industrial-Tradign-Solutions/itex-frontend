import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DepartmentModalComponent } from './department-modal.component';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextareaModule } from 'primeng/inputtextarea';


@NgModule({
  declarations: [
    DepartmentModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    InputTextareaModule,
    ButtonModule,
    ProgressBarModule,
    CheckboxModule
  ],
  exports: [
    DepartmentModalComponent
  ]
})
export class DepartmentModalModule { }

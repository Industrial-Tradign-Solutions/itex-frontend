import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleModalComponent } from './role-modal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { InputTextareaModule } from 'primeng/inputtextarea';


@NgModule({
  declarations: [
    RoleModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    InputTextareaModule,
    ButtonModule,
    ProgressBarModule,
  ],
  exports: [
    RoleModalComponent
  ]
})
export class RoleModalModule { }

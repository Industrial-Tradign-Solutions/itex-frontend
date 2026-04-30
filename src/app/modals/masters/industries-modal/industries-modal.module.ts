import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IndustriesModalComponent } from './industries-modal.component';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    IndustriesModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    InputTextareaModule,
    ButtonModule,
    ProgressBarModule
  ],
  exports: [
    IndustriesModalComponent
  ]
})
export class IndustriesModalModule { }

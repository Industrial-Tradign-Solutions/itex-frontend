import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SendEmailModalComponent } from './send-email-modal.component';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProgressBarModule } from 'primeng/progressbar';
import { EditorModule } from 'primeng/editor';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';


@NgModule({
  declarations: [
    SendEmailModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    ProgressBarModule,
    EditorModule,
    ButtonModule,
    ChipModule
  ],
  exports: [
    SendEmailModalComponent
  ]
})
export class SendEmailModalModule { }

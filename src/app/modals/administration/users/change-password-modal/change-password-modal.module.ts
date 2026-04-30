import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogModule, DialogService } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PasswordModule } from 'primeng/password';
import { ProgressBarModule } from 'primeng/progressbar';
import { ChangePasswordModalComponent } from './change-password-modal.component';
import { MessageModule } from 'primeng/message';

@NgModule({
  declarations: [
    ChangePasswordModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DynamicDialogModule,
    ButtonModule,
    PasswordModule,
    ProgressBarModule,
    MessageModule
  ],
  exports: [
    ChangePasswordModalComponent
  ],
  providers: [
    DialogService
  ]
})
export class ChangePasswordModalModule { }

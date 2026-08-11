import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { PipesModule } from '@pipes/pipes.module';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { FileUploadModule } from 'primeng/fileupload';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ProgressBarModule } from 'primeng/progressbar';
import { RegisterPaymentModalComponent } from './register-payment-modal.component';

@NgModule({
  declarations: [
    RegisterPaymentModalComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PipesModule,
    ButtonModule,
    CalendarModule,
    DropdownModule,
    FileUploadModule,
    InputNumberModule,
    InputTextareaModule,
    ProgressBarModule
  ],
  exports: [
    RegisterPaymentModalComponent
  ]
})
export class RegisterPaymentModalModule { }

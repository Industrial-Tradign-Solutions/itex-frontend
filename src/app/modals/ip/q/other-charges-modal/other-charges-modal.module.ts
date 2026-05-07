import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OtherChargesModalComponent } from './other-charges-modal.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ProgressBarModule } from 'primeng/progressbar';

@NgModule({
  declarations: [
    OtherChargesModalComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    ProgressBarModule
  ],
  exports: [
    OtherChargesModalComponent
  ]
})
export class OtherChargesModalModule { }

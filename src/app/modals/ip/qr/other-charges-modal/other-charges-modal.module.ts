import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OtherChargesModalComponent } from './other-charges-modal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';



@NgModule({
  declarations: [
    OtherChargesModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ProgressBarModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    InputNumberModule
  ],
  exports: [
    OtherChargesModalComponent
  ]
})
export class OtherChargesModalModule { }

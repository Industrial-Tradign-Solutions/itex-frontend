import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpenCloseConfirmationModalComponent } from './open-close-confirmation-modal.component';
import { ButtonModule } from 'primeng/button';



@NgModule({
  declarations: [
    OpenCloseConfirmationModalComponent
  ],
  imports: [
    CommonModule,
    ButtonModule
  ],
  exports: [
    OpenCloseConfirmationModalComponent
  ]
})
export class OpenCloseConfirmationModalModule { }

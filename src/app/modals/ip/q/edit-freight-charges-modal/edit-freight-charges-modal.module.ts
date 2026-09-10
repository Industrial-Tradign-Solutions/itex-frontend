import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditFreightChargesModalComponent } from './edit-freight-charges-modal.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';

@NgModule({
  declarations: [
    EditFreightChargesModalComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputNumberModule,
    TooltipModule
  ],
  exports: [
    EditFreightChargesModalComponent
  ]
})
export class EditFreightChargesModalModule { }

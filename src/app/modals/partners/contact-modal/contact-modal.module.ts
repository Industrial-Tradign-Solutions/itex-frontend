import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactModalComponent } from './contact-modal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { CheckboxModule } from 'primeng/checkbox';
import { TableModule } from 'primeng/table';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';

@NgModule({
  declarations: [
    ContactModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    ProgressBarModule,
    CheckboxModule,
    TableModule,
    InputNumberModule,
    DropdownModule
  ],
  exports: [
    ContactModalComponent
  ]
})
export class ContactModalModule { }

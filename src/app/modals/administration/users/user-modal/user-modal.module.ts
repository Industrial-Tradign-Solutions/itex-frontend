import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ProgressBarModule } from 'primeng/progressbar';
import { UserModalComponent } from './user-modal.component';
import { MultiSelectModule } from 'primeng/multiselect';


@NgModule({
  declarations: [
    UserModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    DropdownModule,
    ProgressBarModule,
    ButtonModule,
    MultiSelectModule
  ],
  exports: [
    UserModalComponent
  ]
})
export class UserModalModule { }

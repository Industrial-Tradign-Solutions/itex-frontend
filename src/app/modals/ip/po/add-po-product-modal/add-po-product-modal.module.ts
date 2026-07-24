import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddPoProductModalComponent } from './add-po-product-modal.component';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { TableModule } from 'primeng/table';

@NgModule({
  declarations: [
    AddPoProductModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ProgressBarModule,
    ButtonModule,
    CheckboxModule,
    TableModule
  ],
  exports: [
    AddPoProductModalComponent
  ]
})
export class AddPoProductModalModule { }

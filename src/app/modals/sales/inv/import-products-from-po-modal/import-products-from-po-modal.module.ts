import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { ImportProductsFromPoModalComponent } from './import-products-from-po-modal.component';

@NgModule({
  declarations: [
    ImportProductsFromPoModalComponent
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
    ImportProductsFromPoModalComponent
  ]
})
export class ImportProductsFromPoModalModule { }

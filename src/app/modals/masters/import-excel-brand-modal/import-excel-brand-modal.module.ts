import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImportExcelBrandModalComponent } from './import-excel-brand-modal.component';
import { FileUploadModule } from 'primeng/fileupload';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';
import { BadgeModule } from 'primeng/badge';



@NgModule({
  declarations: [
    ImportExcelBrandModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    FileUploadModule,
    TableModule,
    ButtonModule,
    AutoCompleteModule,
    BadgeModule
  ],
  exports: [
    ImportExcelBrandModalComponent
  ]
})
export class ImportExcelBrandModalModule { }

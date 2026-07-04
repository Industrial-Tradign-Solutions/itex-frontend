import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImportOtherChargesFromQrModalComponent } from './import-other-charges-from-qr-modal.component';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { CheckboxModule } from 'primeng/checkbox';
import { PipesModule } from '@pipes/pipes.module';

@NgModule({
  declarations: [
    ImportOtherChargesFromQrModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    ProgressBarModule,
    CheckboxModule,
    PipesModule
  ],
  exports: [
    ImportOtherChargesFromQrModalComponent
  ]
})
export class ImportOtherChargesFromQrModalModule { }

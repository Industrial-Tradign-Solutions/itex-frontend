import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImportOtherChargesFromQrModalComponent } from './import-other-charges-from-qr-modal.component';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { PipesModule } from '@pipes/pipes.module';

@NgModule({
  declarations: [
    ImportOtherChargesFromQrModalComponent
  ],
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    ProgressBarModule,
    PipesModule
  ],
  exports: [
    ImportOtherChargesFromQrModalComponent
  ]
})
export class ImportOtherChargesFromQrModalModule { }

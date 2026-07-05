import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListOtherChargesModalComponent } from './list-other-charges-modal.component';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { PipesModule } from '@pipes/pipes.module';
import { ImportOtherChargesFromQrModalModule } from '../import-other-charges-from-qr-modal/import-other-charges-from-qr-modal.module';

@NgModule({
  declarations: [
    ListOtherChargesModalComponent
  ],
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    TooltipModule,
    ProgressBarModule,
    PipesModule,
    ImportOtherChargesFromQrModalModule
  ],
  exports: [
    ListOtherChargesModalComponent
  ]
})
export class ListOtherChargesModalModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListOtherChargesModalComponent } from './list-other-charges-modal.component';
import { OtherChargesModalModule } from '../other-charges-modal/other-charges-modal.module';
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { PipesModule } from '@pipes/pipes.module';

@NgModule({
  declarations: [
    ListOtherChargesModalComponent
  ],
  imports: [
    CommonModule,
    OtherChargesModalModule,
    TableModule,
    ProgressBarModule,
    ButtonModule,
    PipesModule
],
  exports: [
    ListOtherChargesModalComponent
  ]
})
export class ListOtherChargesModalModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListOtherChargesModalComponent } from './list-other-charges-modal.component';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { PipesModule } from '@pipes/pipes.module';

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
    PipesModule
  ],
  exports: [
    ListOtherChargesModalComponent
  ]
})
export class ListOtherChargesModalModule { }

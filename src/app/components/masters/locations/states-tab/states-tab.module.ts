import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatesTabComponent } from './states-tab.component';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { StateModalModule } from '@modals/masters/locations/state-modal/state-modal.module';



@NgModule({
  declarations: [
    StatesTabComponent
  ],
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ToolbarModule,
    TooltipModule,
    StateModalModule
  ],
  exports: [
    StatesTabComponent
  ]
})
export class StatesTabModule { }

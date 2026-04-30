import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IndustriesRoutingModule } from './industries-routing.module';
import { IndustriesComponent } from './industries.component';
import { IndustriesModalModule } from '@modals/masters/industries-modal/industries-modal.module';
import { ToolbarModule } from 'primeng/toolbar';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';


@NgModule({
  declarations: [
    IndustriesComponent
  ],
  imports: [
    CommonModule,
    IndustriesRoutingModule,
    IndustriesModalModule,
    ToolbarModule,
    TableModule,
    InputTextModule,
    TooltipModule,
    ButtonModule
  ]
})
export class IndustriesModule { }

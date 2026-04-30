import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CitiesTabComponent } from './cities-tab.component';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CityModalModule } from '@modals/masters/locations/city-modal/city-modal.module';



@NgModule({
  declarations: [
    CitiesTabComponent
  ],
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ToolbarModule,
    TooltipModule,
    CityModalModule
  ],
  exports: [
    CitiesTabComponent
  ]
})
export class CitiesTabModule { }

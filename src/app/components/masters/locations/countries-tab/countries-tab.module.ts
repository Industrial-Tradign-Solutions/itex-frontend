import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CountriesTabComponent } from './countries-tab.component';
import { CountryModalModule } from '@modals/masters/locations/country-modal/country-modal.module';


@NgModule({
  declarations: [
    CountriesTabComponent
  ],
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ToolbarModule,
    TooltipModule,
    CountryModalModule
  ],
  exports: [
    CountriesTabComponent
  ]
})
export class CountriesTabModule { }

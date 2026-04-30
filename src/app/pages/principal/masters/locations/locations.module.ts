import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LocationsRoutingModule } from './locations-routing.module';
import { LocationsComponent } from './locations.component';
import { TabViewModule } from 'primeng/tabview';
import { CitiesTabModule, CountriesTabModule, StatesTabModule } from '@components/masters/locations';




@NgModule({
  declarations: [
    LocationsComponent
  ],
  imports: [
    CommonModule,
    LocationsRoutingModule,
    TabViewModule,
    CountriesTabModule,
    CitiesTabModule,
    StatesTabModule
  ]
})
export class LocationsModule { }

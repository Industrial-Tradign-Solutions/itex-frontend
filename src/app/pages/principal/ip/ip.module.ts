import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IpRoutingModule } from './ip-routing.module';
import { IpComponent } from './ip.component';


@NgModule({
  declarations: [
    IpComponent
  ],
  imports: [
    CommonModule,
    IpRoutingModule
  ]
})
export class IpModule { }

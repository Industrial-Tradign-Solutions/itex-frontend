import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RolesRoutingModule } from './roles-routing.module';
import { RolesComponent } from './roles.component';
import { TabViewModule } from 'primeng/tabview';
import { PermissionsModule } from '@components/admin/permissions/permissions.module';



@NgModule({
  declarations: [
    RolesComponent
  ],
  imports: [
    CommonModule,
    RolesRoutingModule,
    TabViewModule,
    PermissionsModule
  ]
})
export class RolesModule { }

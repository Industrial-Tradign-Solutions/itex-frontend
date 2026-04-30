import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PrincipalRoutingModule } from './principal-routing.module';
import { PrincipalComponent } from './principal.component';
import { ToastModule } from 'primeng/toast';
import { LayoutPrimeModule } from '../../layout/layout.module';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ChangePasswordModalModule } from '@modals/administration/users/change-password-modal/change-password-modal.module';



@NgModule({
  declarations: [
    PrincipalComponent
  ],
  imports: [
    CommonModule,
    PrincipalRoutingModule,
    LayoutPrimeModule,
    ChangePasswordModalModule,
    ToastModule,
    ConfirmDialogModule
  ]
})
export class PrincipalModule { }

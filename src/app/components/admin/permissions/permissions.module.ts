import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RolesComponent } from './roles/roles.component';
import { ActionsComponent } from './actions/actions.component';
import { ModulesComponent } from './modules/modules.component';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';

import { DropdownModule } from 'primeng/dropdown';
import { ProgressBarModule } from 'primeng/progressbar';
import { PickListModule } from 'primeng/picklist';
import { FormsModule } from '@angular/forms';
import { RoleModalModule } from '@modals/administration/roles/role-modal/role-modal.module';


@NgModule({
  declarations: [
    RolesComponent,
    ActionsComponent,
    ModulesComponent
  ],
  imports: [
    CommonModule,
    ConfirmDialogModule,
    ToolbarModule,
    TableModule,
    InputTextModule,
    RoleModalModule,
    DropdownModule,
    ProgressBarModule,
    PickListModule,
    FormsModule
  ],
  providers: [
    ConfirmationService,
    DialogService,
  ],
  exports: [
    RolesComponent,
    ActionsComponent,
    ModulesComponent
  ]
})
export class PermissionsModule { }

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Messages } from '@config/messages';
import { ActionType } from '@config/types/menu';
import { BasicRole } from '@interfaces/administration/roles';
import { RolesService } from '@services/admin/roles.service';
import { MessageService } from 'primeng/api';

const MESSAGES = Messages.pages.masters.roles;

@Component({
  selector: 'app-admin-permissions-actions',
  templateUrl: './actions.component.html',
  styleUrls: ['./actions.component.scss']
})
export class ActionsComponent {


  @Input() listActiveRoles!: BasicRole[];
  @Output() listActiveRolesAction = new EventEmitter<void>();

  listAssignedActions!: ActionType[];
  listUnassignedActions!: ActionType[];

  selectedRoleId: string = '';
  loading: boolean = false;

  constructor(
    private roleSV: RolesService,
    private messageSV: MessageService
  ) {
  }

  async selectRole(event: any) {
    this.selectedRoleId = '';
    this.loading = true;
    this.listAssignedActions = [];
    this.listUnassignedActions = [];

    try {
      const data = await this.roleSV.getListActionsByIdRole(event.value);
      setTimeout(() => {
        this.listAssignedActions = data.assignedActions.sort((a, b) => this.sortActions(a, b));
        this.listUnassignedActions = data.unassignedActions.sort((a, b) => this.sortActions(a, b));
        this.selectedRoleId = event.value;
        this.loading = false;
      }, 1000);
    } catch(err ) {
      this.loading = false;
    }
  }

  loadRoles() {
    this.listActiveRolesAction.emit();
  }

  private sortActions(a: any, b: any){
    if(a.menu?.name > b.menu?.name){
      return -1;
    }
    if(a.menu?.name < b.menu?.name){
      return 1;
    }
    return 0;
  }

  async saveAction() {
    this.loading = true;
    const data = {
      actionIds: this.getData()
    };
    try {
      const resp = await this.roleSV.updateListActionsByIdRole(this.selectedRoleId, data);
      if (resp && resp.length >= 0) {
        const role = this.listActiveRoles.find(role => role.id === this.selectedRoleId);
        this.messageSV.add({
          key: 'main-toast',
          severity: 'success',
          detail: MESSAGES.update_actions(role?.name),
          summary: 'Exito!',
          life: 10000
        });
        this.selectedRoleId = '';
        this.listAssignedActions = [];
        this.listUnassignedActions = [];
      }
    } catch(err: any) {
      this.messageSV.add({
        key: 'main-toast',
        severity: 'error',
        detail: err.errorMessage,
        summary: 'Error!',
        life: 10000
      });
    } finally {
      setTimeout(() => {
        this.loading = false;
      }, 1000);
    }
  }

  private getData(): number[] {
    return this.listAssignedActions.map(action => action.id);
  }
}

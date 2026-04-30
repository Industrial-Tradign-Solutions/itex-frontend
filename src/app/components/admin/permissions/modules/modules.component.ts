import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Messages } from '@config/messages';
import { MenuItemType } from '@config/types/menu';
import { BasicRole } from '@interfaces/administration/roles';
import { RolesService } from '@services/admin/roles.service';
import { MessageService } from 'primeng/api';

const MESSAGES = Messages.pages.masters.roles;


@Component({
  selector: 'app-admin-permissions-modules',
  templateUrl: './modules.component.html',
  styleUrls: ['./modules.component.scss']
})
export class ModulesComponent {

  @Input() listActiveRoles!: BasicRole[];
  @Output() listActiveRolesAction = new EventEmitter<void>();

  listAssignedMenus!: MenuItemType[];
  listUnassignedMenus!: MenuItemType[];

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
    this.listAssignedMenus = [];
    this.listUnassignedMenus = [];

    try {
      const data = await this.roleSV.getListMenusByIdRole(event.value);
      setTimeout(() => {
        this.listAssignedMenus = data.assignedMenus;
        this.listUnassignedMenus = data.unassignedMenus;
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

  async saveAction() {
    this.loading = true;
    const data = {
      menuIds: this.getData()
    };
    try {
      const resp = await this.roleSV.updateListMenusByIdRole(this.selectedRoleId, data);
      if (resp && resp.length >= 0) {
        const role = this.listActiveRoles.find(role => role.id === this.selectedRoleId);
        this.messageSV.add({
          key: 'main-toast',
          severity: 'success',
          detail: MESSAGES.update_modules(role?.name),
          summary: 'Exito!',
          life: 10000
        });
        this.selectedRoleId = '';
        this.listAssignedMenus = [];
        this.listUnassignedMenus = [];
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
    return this.listAssignedMenus.map(menuItem => menuItem.id);
  }

}

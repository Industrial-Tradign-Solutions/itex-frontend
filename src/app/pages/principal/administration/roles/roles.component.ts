import { Component, HostListener, OnDestroy, OnInit, Signal, computed } from '@angular/core';
import { moduleActionsId } from '../../../../../environments/module-actions-ids';
import { storageKeys } from '../../../../../environments';
import { RolesService } from '@services/admin/roles.service';
import { PermissionService } from '@services/security';
import { StorageService } from '@services/util';
import { UserInfo } from '@interfaces/administration/user';
import { BasicRole } from '@interfaces/administration/roles';
import { BasicPage } from '@config/page/basicPage';


const ROLE_ACTIONS_ID = moduleActionsId.admin.roles;
const USER_DATA_STORAGE_KEY = storageKeys.user_data.info;

@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styles: ``
})
export class RolesComponent extends BasicPage implements OnInit, OnDestroy {

  rolePermissions = {
    updateRoleActions: false,
    updateRoleModules: false
  };

  userInfo!: Signal<UserInfo>;

  constructor(
    private permissionsSV: PermissionService,
    private roleSV: RolesService
  ) {
    super(true, 'Roles');
    this.loadRoleActions();

  }

  ngOnDestroy(): void {
    this.destroyTab();
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification(event: any): void {
    this.destroyTab();
  }

  ngOnInit() {
    this.storageSV.get(USER_DATA_STORAGE_KEY).then(resp => {
      this.userInfo = computed(() => resp);
      this.listActiveRolesAction();
    });
  }

  get listActiveRoles(): BasicRole[] {
    return this.roleSV.listRoles();
  }

  listActiveRolesAction() {
    this.roleSV.loadRoles(false);
  }

  private async loadRoleActions() {
    this.rolePermissions = {
      updateRoleActions: await this.permissionsSV.isValidAction(ROLE_ACTIONS_ID.UPDATE_ROLE_ACTIONS),
      updateRoleModules: await this.permissionsSV.isValidAction(ROLE_ACTIONS_ID.UPDATE_ROLE_MENUS)
    };
  }
}

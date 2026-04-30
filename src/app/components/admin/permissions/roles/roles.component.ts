import { Component, EventEmitter, OnInit, Output, Signal, computed, inject, signal } from '@angular/core';
import { Table } from 'primeng/table';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { moduleActionsId, storageKeys } from '../../../../../environments';
import { RolesService } from '@services/admin/roles.service';
import { PermissionService } from '@services/security';
import { StorageService, UtilService } from '@services/util';
import { RoleModalComponent } from '@modals/administration/roles/role-modal/role-modal.component';
import { UserInfo } from '@interfaces/administration/user';
import { Role } from '@interfaces/administration/roles';
import { Observable } from 'rxjs';
import { MessageResponse } from '@interfaces/message-response';
import { environment } from '../../../../../environments/environment';
import { Messages } from '@config/messages';

const ROLE_ACTIONS_ID = moduleActionsId.admin.roles;
const USER_DATA_STORAGE_KEY = storageKeys.user_data.info;
const TIMEOUT = environment.timeout;
const MESSAGES = Messages.pages.masters.roles;

@Component({
  selector: 'app-admin-permissions-roles',
  templateUrl: './roles.component.html',
  styles: ``
})
export class RolesComponent implements OnInit {

  constructor() {}

  //! Inyecciones
  private permissionsSV  = inject(PermissionService);
  private roleSV         = inject(RolesService);
  private utilSV         = inject(UtilService);
  private storageSV      = inject(StorageService);
  private dialogSV       = inject(DialogService);
  //! ----------------------------------------------------------

  //* Señales
  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());

  private _listRoles = signal<Role[]>([]);
  listRoles = computed<Role[]>(() => this._listRoles());

  private _rolePermissions = signal({
    createRole: false,
    updateRole: false,
    enableRole: false,
    disableRole: false
  });
  rolePermissions = computed(() => this._rolePermissions());

  modalRoleRef!: Signal<DynamicDialogRef | undefined>;
  userInfo!: Signal<UserInfo>;
  //* -----------------------------------------------------------

  @Output() listActiveRoles = new EventEmitter<void>();

  ngOnInit() {
    this.loadRoleActions();
    this.loadListRoles();
    this.storageSV.get(USER_DATA_STORAGE_KEY).then(resp => {
      this.userInfo = computed(() => resp);
    });
  }

  openModalRole(type: 'edit' | 'create', role?: Role) {
    this.modalRoleRef =  computed(() => this.dialogSV.open(RoleModalComponent,{
      header: `${(type === 'edit'? 'UPDATE' : 'CREATE')} ROLE` ,
      width: '40rem',
      closable: false,
      closeOnEscape: false,
      data: {
        type,
        role
      }
    }));
    this.modalRoleRef()?.onClose.subscribe((resp: {roleResponse: MessageResponse<Role>}) => {
      if (resp && resp.roleResponse) {
        this.utilSV.setMessage(resp.roleResponse.title, resp.roleResponse.message, 'success');
        this.listActiveRoleAction();
        this.loadListRoles();
      }
      this.modalRoleRef = computed(() => undefined);
    });
  }

  disableRole(role: Role) {
    if (role.id === this.userInfo().roleId) return;
    if (!this.rolePermissions().disableRole) return;
    this.utilSV.confirm({
      message: MESSAGES.disable(role.name),
      accept: () => {
        this.serviceAction(this.roleSV.disable(role.id));
      }
    });
  }

  enableRole(role: Role) {
    if (!this.rolePermissions().enableRole) return;
    this.utilSV.confirm({
      message: MESSAGES.enable(role.name),
      accept: () => {
        this.serviceAction(this.roleSV.enable(role.id));
      }
    });
  }

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  loadListRoles() {
    this._loading.set(true);
    setTimeout(() => {
      this.roleSV.listAll().subscribe({
        next: resp => {
          this._loading.set(false);
          this._listRoles.set(resp);
        },
        error: err => {
          this.utilSV.setMessage('¡Error!', err, 'error');
          this._loading.set(false);
        }
      });
    }, TIMEOUT);
  }

  private serviceAction(observable: Observable<MessageResponse<string>>) {
    this._loading.set(true);
    setTimeout(() => {
      observable.subscribe({
        next: resp => {
          this.utilSV.setMessage(resp.title, resp.message, 'success');
          this.listActiveRoleAction();
          this.loadListRoles();
        },
        error: err => {
          this.utilSV.setMessage('¡Error!', err, 'error');
          this._loading.set(false);
        }
      });
    }, TIMEOUT);
  }

  private listActiveRoleAction() {
    this.listActiveRoles.emit();
  }

  private async loadRoleActions() {
    this._rolePermissions.set({
      createRole: await this.permissionsSV.isValidAction(ROLE_ACTIONS_ID.CREATE_ROLE),
      updateRole: await this.permissionsSV.isValidAction(ROLE_ACTIONS_ID.UPDATE_ROLE),
      enableRole: await this.permissionsSV.isValidAction(ROLE_ACTIONS_ID.ENABLE_ROLE),
      disableRole: await this.permissionsSV.isValidAction(ROLE_ACTIONS_ID.DISABLE_ROLE)
    });
  }

}

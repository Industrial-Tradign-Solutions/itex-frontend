import { Component, HostListener, OnDestroy, OnInit, Signal, computed, inject, signal } from '@angular/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Table } from 'primeng/table';
import { moduleActionsId, storageKeys } from '../../../../../environments';
import { UsersService } from '@services/admin/users.service';
import { PermissionService } from '@services/security';
import { UtilService } from '@services/util';
import { ListUser, User, UserInfo } from '@interfaces/administration/user';
import { MessageResponse } from '@interfaces/message-response';
import { Observable } from 'rxjs';
import { UserModalComponent } from '@modals/administration/users/user-modal/user-modal.component';
import { environment } from '../../../../../environments/environment';
import { BasicPage } from '@config/page/basicPage';
import { Messages, TitlesMessages } from '@config/messages';

const USER_ACTIONS_ID = moduleActionsId.admin.user;
const USER_DATA_STORAGE_KEY = storageKeys.user_data.info;
const TIMEOUT = environment.timeout;
const TITLES = TitlesMessages;
const MESSAGES = Messages.pages.administration.users;

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styles: ``
})
export class UsersComponent extends BasicPage implements OnInit, OnDestroy {

  constructor() {
    super(true, 'Users');
  }

  //! Inyecciones
  private permissionsSV  = inject(PermissionService);
  private userSV         = inject(UsersService);
  private utilSV         = inject(UtilService);
  private dialogSV       = inject(DialogService);
  //! ----------------------------------------------------------

  //* Señales

  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());

  private _userPermissions = signal({
    createUser: false,
    updateUser: false,
    enableUser: false,
    disableUser: false,
    resetUserPassword: false,
    closeAllSessions: false
  });
  userPermissions = computed(() => this._userPermissions());

  private _listUsers = signal<ListUser[]>([]);
  listUsers = computed<ListUser[]>(() => this._listUsers());

  modalUserRef!: Signal<DynamicDialogRef | undefined>;
  userInfo!: Signal<UserInfo>;
  //* -----------------------------------------------------------

  ngOnInit() {
    this.loadUserActions();
    this.loadListUsers();
    this.storageSV.get(USER_DATA_STORAGE_KEY).then(resp => {
      this.userInfo = computed(() => resp);
    });
  }

  ngOnDestroy(): void {
    this.destroyTab();
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification(event: any): void {
    this.destroyTab();
  }

  openModalUser(type: 'create' | 'edit' | 'view', user?: User) {
    this.modalUserRef =  computed(() => this.dialogSV.open(UserModalComponent,{
      header: `${(type === 'edit'? 'UPDATE' : type === 'create' ? 'CREATE' : 'VIEW')} USER` ,
      width: '50rem',
      closable: type === 'view',
      closeOnEscape: false,
      data: {
        type,
        user
      }
    }));
    this.modalUserRef()?.onClose.subscribe((resp: {userResponse: MessageResponse<User>}) => {
      if (resp && resp.userResponse) {
        this.utilSV.setMessage(resp.userResponse.title, resp.userResponse.message, 'success');
        this.loadListUsers();
      }
      this.modalUserRef = computed(() => undefined);
    });
  }

  resetUserPassword(user: User) {
    if (!this.userPermissions().resetUserPassword) return;
    this.utilSV.confirm({
      message: MESSAGES.reset_password(user.email),
        header: TITLES.confirmation,
      accept: () => {
        this.serviceAction(this.userSV.resetUserPass(user));
      }
    });
  }

  closeAllSessions() {
    if (!this.userPermissions().closeAllSessions) return;
    const offlineMinutes = 10;
    this.utilSV.confirm({
      message: MESSAGES.close_sesions(offlineMinutes),
        header: TITLES.confirmation,
      accept: () => {
        this.serviceAction(this.userSV.closeAllSessions(offlineMinutes));
      }
    });
  }

  enableUser(user: User) {
    if (!this.userPermissions().enableUser) return;
    this.utilSV.confirm({
      message: MESSAGES.enable(user.email),
      header: TITLES.confirmation,
      accept: () => {
        this.serviceAction(this.userSV.enable(user.id));
      }
    });
  }

  disableUser(user: User) {
    if (this.userInfo().id === user.id) return;
    if (!this.userPermissions().enableUser) return;

    this.utilSV.confirm({
      message: MESSAGES.disable(user.email),
      header: TITLES.confirmation,
      accept: () => {
        this.serviceAction(this.userSV.disable(user.id));
      }
    });
  }

  loadListUsers() {
    this._loading.set(true);
    setTimeout(() => {
      this.userSV.listAll().subscribe({
        next: resp => {
          this._loading.set(false);
          this._listUsers.set(resp);
        },
        error: err => {
          this.utilSV.setMessage('¡Error!', err, 'error');
          this._loading.set(false);
        }
      });
    }, TIMEOUT);
  }

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  private serviceAction(observable: Observable<MessageResponse<number | string>>) {
    this._loading.set(true);
    setTimeout(() => {
      observable.subscribe({
        next: resp => {
          this.utilSV.setMessage(resp.title, resp.message, 'success');
          this.loadListUsers();
        },
        error: err => {
          this.utilSV.setMessage('¡Error!', err, 'error');
          this._loading.set(false);
        }
      });
    }, TIMEOUT);
  }

  private async loadUserActions() {
    this._userPermissions.set({
      createUser: await this.permissionsSV.isValidAction(USER_ACTIONS_ID.CREATE_USER),
      updateUser: await this.permissionsSV.isValidAction(USER_ACTIONS_ID.UPDATE_USER),
      enableUser: await this.permissionsSV.isValidAction(USER_ACTIONS_ID.ENABLE_USER),
      disableUser: await this.permissionsSV.isValidAction(USER_ACTIONS_ID.DISABLE_USER),
      resetUserPassword: await this.permissionsSV.isValidAction(USER_ACTIONS_ID.RESET_PASS_USER),
      closeAllSessions: await this.permissionsSV.isValidAction(USER_ACTIONS_ID.CLOSE_ALL_SESSIONS)
    });
  }
}

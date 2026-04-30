import { Component, HostListener, OnDestroy, OnInit, Signal, computed, inject, signal } from '@angular/core';
import { Table } from 'primeng/table';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Observable } from 'rxjs';
import { moduleActionsId, storageKeys } from '../../../../../environments';
import { PermissionService } from '@services/security';
import { DepartmentService } from '@services/masters';
import { UtilService } from '@services/util';
import { Department } from '@interfaces/masters/departments';
import { DepartmentModalComponent } from '@modals/masters/department-modal/department-modal.component';
import { MessageResponse } from '@interfaces/message-response';
import { UserInfo } from '@interfaces/administration/user';
import { environment } from '../../../../../environments/environment';
import { BasicPage } from '@config/page/basicPage';
import { Messages } from '@config/messages';


const DEPARTMENTS_ACTIONS_ID = moduleActionsId.masters.departments;
const TIMEOUT = environment.timeout;
const MESSAGES = Messages.pages.masters.departments;

@Component({
  selector: 'app-departments',
  templateUrl: './departments.component.html',
  styles: ``
})
export class DepartmentsComponent extends BasicPage implements OnInit, OnDestroy {

  constructor() {
    super(true, 'Departments');
  }

  ngOnDestroy(): void {
    this.destroyTab();
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification(event: any): void {
    this.destroyTab();
  }

  //! Inyecciones
  private permissionsSV  = inject(PermissionService);
  private departmentSV   = inject(DepartmentService);
  private utilSV         = inject(UtilService);
  private dialogSV       = inject(DialogService);
  //! ----------------------------------------------------------

  //* Señales
  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());

  private _listDepartments = signal<Department[]>([]);
  listDepartments = computed<Department[]>(() => this._listDepartments());

  private _departmentPermissions = signal({
    createDepartment: false,
    updateDepartment: false,
    enableDepartment: false,
    disableDepartment: false
  });
  departmentPermissions = computed(() => this._departmentPermissions());

  modalDepartmentRef!: Signal<DynamicDialogRef | undefined>;
  userInfo!: Signal<UserInfo>;
  //* -----------------------------------------------------------

  ngOnInit(): void {
    this.loadDepartmentActions();
    this.loadListDepartments();
  }

  openModalDepartment(type: 'create' | 'edit', department?: Department) {
    this.modalDepartmentRef =  computed(() => this.dialogSV.open(DepartmentModalComponent,{
      header: `${(type === 'edit'? 'UPDATE' : 'CREATE')} DEPARTMENT` ,
      width: '50rem',
      closable: false,
      closeOnEscape: false,
      data: {
        type,
        department
      }
    }));
    this.modalDepartmentRef()?.onClose.subscribe((resp: {departmentResponse: MessageResponse<Department>}) => {
      if (resp && resp.departmentResponse) {
        this.utilSV.setMessage(resp.departmentResponse.title, resp.departmentResponse.message, 'success');
        this.loadListDepartments();
      }
      this.modalDepartmentRef = computed(() => undefined);
    });
  }

  disableDepartment(department: Department) {
    if (!this.departmentPermissions().disableDepartment) return;
    this.utilSV.confirm({
      message: MESSAGES.disable(department.name),
      accept: () => {
        this.serviceAction(this.departmentSV.disable(department.id));
      }
    });
  }

  enableDepartment(department: Department) {
    if (!this.departmentPermissions().enableDepartment) return;
    this.utilSV.confirm({
      message: MESSAGES.enable(department.name),
      accept: () => {
        this.serviceAction(this.departmentSV.enable(department.id));
      }
    });
  }

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  loadListDepartments() {
    this._loading.set(true);
    setTimeout(() => {
      this.departmentSV.listAll().subscribe({
        next: resp => {
          this._loading.set(false);
          this._listDepartments.set(resp);
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
          this.loadListDepartments();
        },
        error: err => {
          this.utilSV.setMessage('¡Error!', err, 'error');
          this._loading.set(false);
        }
      });
    }, TIMEOUT);
  }

  private async loadDepartmentActions() {
    this._departmentPermissions.set({
      createDepartment: await this.permissionsSV.isValidAction(DEPARTMENTS_ACTIONS_ID.CREATE_DEPARTMENT),
      updateDepartment: await this.permissionsSV.isValidAction(DEPARTMENTS_ACTIONS_ID.UPDATE_DEPARTMENT),
      enableDepartment: await this.permissionsSV.isValidAction(DEPARTMENTS_ACTIONS_ID.ENABLE_DEPARTMENT),
      disableDepartment: await this.permissionsSV.isValidAction(DEPARTMENTS_ACTIONS_ID.DISABLE_DEPARTMENT)
    });
  }
}

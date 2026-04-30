import { Component, computed, inject, OnInit, Signal, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BasicRole } from '@interfaces/administration/roles';
import { User, UserRequest } from '@interfaces/administration/user';
import { BasicDepartment } from '@interfaces/masters/departments';
import { MessageResponse } from '@interfaces/message-response';
import { RolesService, UsersService } from '@services/admin';
import { DepartmentService } from '@services/masters';
import { UtilService } from '@services/util';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

const TIMEOUT = environment.timeout;

@Component({
  selector: 'app-user-modal',
  templateUrl: './user-modal.component.html',
  styleUrls: ['./user-modal.component.scss']
})
export class UserModalComponent implements OnInit {

  //! Inyecciones
  private config      = inject(DynamicDialogConfig);
  private ref         = inject(DynamicDialogRef);
  private departmentSV= inject(DepartmentService);
  private formBuilder = inject(FormBuilder);
  private userSV      = inject(UsersService);
  private roleSV      = inject(RolesService);
  private utilSV      = inject(UtilService);
  //! -----------------------------------------------

  //* Señales
  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());

  private _type = signal<'edit' | 'create' | 'view'>(this.config.data.type);
  type = computed<'edit' | 'create' | 'view'>(() => this._type());

  private _user = signal<User >(this.config.data.user);
  user = computed<User>(() => this._user());

  private _error = signal<string | null>(null);
  error = computed<string | null>(() => this._error());
  //*------------------------------------------------

  formUser!: FormGroup;
  constructor() {
    setTimeout(() => {
      if (this.type() === 'edit' || this.type() === 'view') {
        this.userSV.findById(this.config.data.user.id)
        .subscribe({
          next: resp => {
            this._user.set(resp);
            this.buildForm();
          },
          error: err => {
            this.utilSV.setMessage('Error!', err, 'error');
            this.closeModal();
          }
        });
      } else {
        this.buildForm();
      }
    }, TIMEOUT);
  }

  ngOnInit(): void {
    this.loadDepartments();
    this.loadRoles();
  }

  loadRoles() {
    if(this.user() && !this.user().role.active) {
      this.roleSV.loadRoles(false,{
        ...this.user().role,
        name: this.user().role.name + ' (DISABLED)'
      });
    } else {
      this.roleSV.loadRoles(false);
    }
  }

  get listRoles(): Signal<BasicRole[]> {
    return this.roleSV.listRoles;
  }

  loadDepartments() {
    this.departmentSV.loadDepartments(true);
  }

  get listDepartments(): Signal<BasicDepartment[]> {
    return this.departmentSV.listDepartments;
  }

  closeModal() {
    this.ref.close();
  }

  onSubmit() {
    if (this.formUser.pristine) {
      this.ref.close();
      return;
    }
    const data: UserRequest = this.formUser.value;
    if (this.type() === 'edit' && this.user()) {
      this.serviceAction(this.userSV.update(this.user().id, data));
    } else if (this.type() === 'create') {
      this.serviceAction(this.userSV.create(data));
    }
  }

  private serviceAction(observable: Observable<MessageResponse<User>>) {
    this._loading.set(true);
    this._error.set(null);
    this.formUser.disable();
    setTimeout(() => {
      observable.subscribe({
        next: resp => {
          this.ref.close({userResponse: resp})
        },
        error: err => {
          this._error.set(err);
          this._loading.set(false);
          this.formUser.enable();
        }
      });
    }, TIMEOUT);
  }

  private buildForm() {
    this.formUser = this.formBuilder.group({
      name: [
        this.user()?.name ?? null,
        [
          Validators.required,
          Validators.minLength(3)
        ]
      ],
      lastName: [
        this.user()?.lastName ?? null,
        [
          Validators.required,
          Validators.minLength(3)
        ]
      ],
      email: [
        this.user()?.email ?? null,
        [
          Validators.required,
          Validators.minLength(3),
          Validators.email
        ]
      ],
      user: [
        this.user()?.user ?? null,
        [
          Validators.required,
          Validators.minLength(3)
        ]
      ],
      emailPassword: [
        this.user()?.emailPassword ?? null,
        []
      ],
      roleId: [
        this.user()?.role?.id ?? null,
        [
          Validators.required
        ]
      ],
      departmentsIds: [
        this.user()?.departments ? (this.user()?.departments.map(dep => dep.id)) : null,
        [
          Validators.required
        ]
      ],
      title: [
        this.user()?.title ?? null,
        [
          Validators.required
        ]
      ],
      extension: [
        this.user()?.extension ?? null,
        [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(4)
        ]
      ]
    });
    if (this.type() === 'view') {
      this.formUser.disable();
    }
  }

}

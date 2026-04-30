import { Component, computed, inject, signal } from '@angular/core';
import { DepartmentService } from '../../../services/masters';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Department, DepartmentRequest } from '../../../models/masters/departments';
import { MessageResponse } from '../../../models/message-response';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

const TIMEOUT = environment.timeout;

@Component({
  selector: 'app-department-modal',
  templateUrl: './department-modal.component.html',
  styleUrl: './department-modal.component.scss'
})
export class DepartmentModalComponent {

  //! Inyecciones
  private config      = inject(DynamicDialogConfig);
  private ref         = inject(DynamicDialogRef);
  private departmentSV= inject(DepartmentService);
  private formBuilder = inject(FormBuilder);
  //! -----------------------------------------------

  //* Señales
  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());
  private _type = signal<'edit' | 'create'>(this.config.data.type);
  type = computed<'edit' | 'create'>(() => this._type());
  private _department = signal<Department>(this.config.data.department);
  department = computed<Department>(() => this._department());
  private _error = signal<string | null>(null);
  error = computed<string | null>(() => this._error());
  //*------------------------------------------------

  formDepartment!: FormGroup;

  constructor() {
    setTimeout(() => {
      if (this.type() === 'edit') {
        this.departmentSV.findById(this.department().id).subscribe({
          next: resp => {
            this._department.set(resp);
            this.buildForm();
          },
          error: err => {
            this._error.set(err);
            this.formDepartment.disable();
          }
        });
      } else {
        this.buildForm();
      }
    }, TIMEOUT);
  }

  closeModal() {
    this.ref.close();
  }

  saveAction() {
    if (this.formDepartment.pristine) {
      this.ref.close();
      return;
    }
    const data:DepartmentRequest = this.formDepartment.value;
    if (this.type() === 'edit' && this.department()) {
      this.serviceAction(this.departmentSV.update(this.department().id, data));
    } else if (this.type() === 'create') {
      this.serviceAction(this.departmentSV.create(data));
    }
  }

  private serviceAction(observable: Observable<MessageResponse<Department>>) {
    this._loading.set(true);
    this._error.set(null);
    this.formDepartment.disable();
    setTimeout(() => {
      observable.subscribe({
        next: resp => {
          this.ref.close({departmentResponse: resp})
        },
        error: err => {
          this._error.set(err);
          this._loading.set(false);
          this.formDepartment.enable();
        }
      });
    }, TIMEOUT);
  }

  private buildForm() {
    this.formDepartment = this.formBuilder.group({
      name: [
        this.department()?.name ?? null,
        [
          Validators.required,
          Validators.maxLength(150)
        ]
      ],
      description: [
        this.department()?.description ?? null,
        [
        ]
      ],
      clientInfo: [
        this.department()?.clientInfo ?? false,
        [
        ]
      ],
      supplierInfo: [
        this.department()?.supplierInfo ?? false,
        [
        ]
      ]
    });
    this.formDepartment.enable();
  }
}

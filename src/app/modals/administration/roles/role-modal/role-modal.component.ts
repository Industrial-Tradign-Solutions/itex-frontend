import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { RolesService } from '../../../../services/admin/roles.service';
import { Role, RoleRequest } from '@interfaces/administration/roles';
import { MessageResponse } from '@interfaces/message-response';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

const TIMEOUT = environment.timeout;

@Component({
  selector: 'app-role-modal',
  templateUrl: './role-modal.component.html',
  styleUrls: ['./role-modal.component.scss']
})
export class RoleModalComponent {

  //! Inyecciones
  private config      = inject(DynamicDialogConfig);
  private ref         = inject(DynamicDialogRef);
  private roleSV      = inject(RolesService);
  private formBuilder = inject(FormBuilder);
  //! -----------------------------------------------

  //* Señales
  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());

  private _type = signal<'edit' | 'create'>(this.config.data.type);
  type = computed<'edit' | 'create'>(() => this._type());

  private _role= signal<Role>(this.config.data.role);
  role = computed<Role>(() => this._role());

  private _error = signal<string | null>(null);
  error = computed<string | null>(() => this._error());
  //*------------------------------------------------
  formRole!: FormGroup;


  constructor() {
    setTimeout(() => {
      if (this.type() === 'edit') {
        this.roleSV.findById(this.role().id).subscribe({
          next: resp => {
            this._role.set(resp);
            this.buildForm();
          },
          error: err => {
            this._error.set(err);
            this.formRole.disable();
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

  onSubmit() {
    if (this.formRole.pristine) {
      this.ref.close();
      return;
    }
    const data: RoleRequest = this.formRole.value;
    if (this.type() === 'edit' && this.role()) {
      this.serviceAction(this.roleSV.update(this.role().id, data));
    } else if (this.type() === 'create') {
      this.serviceAction(this.roleSV.create(data));
    }
  }

  private serviceAction(observable: Observable<MessageResponse<Role>>) {
    this._loading.set(true);
    this._error.set(null);
    this.formRole.disable();
    setTimeout(() => {
      observable.subscribe({
        next: resp => {
          this.ref.close({roleResponse: resp})
        },
        error: err => {
          this._error.set(err);
          this._loading.set(false);
          this.formRole.enable();
        }
      });
    }, TIMEOUT);
  }

  private buildForm() {
    this.formRole = this.formBuilder.group({
      name: [
        this.role()?.name ?? null,
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(70)
        ]
      ],
      description: [
        this.role()?.description ?? null,
        [
        ]
      ]
    });
  }

}

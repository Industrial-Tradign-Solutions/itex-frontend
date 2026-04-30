import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AuthService } from '../../../../services/security/auth.service';
import { UsersService } from '../../../../services/admin/users.service';
import { UserInfo } from '@interfaces/administration/user';
import { environment } from '../../../../../environments/environment';

const TIMEOUT = environment.timeout;

@Component({
  selector: 'app-change-password-modal',
  templateUrl: './change-password-modal.component.html',
  styleUrls: ['./change-password-modal.component.scss']
})
export class ChangePasswordModalComponent {
  private user!: UserInfo;
  formChangePass!: FormGroup;
  errorMsges: any;
  errorMessage = '';

  loading: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private ref: DynamicDialogRef,
    private config: DynamicDialogConfig,
    private authSV: AuthService,
    private userSV: UsersService,
    private messageSV: MessageService
  ) {
    this.user = this.config.data.user;
    this.buildForm();
  }

  logout() {
    this.ref.close({changed: false});
    this.authSV.logoutAction();
  }

  async onSubmit() {
    this.errorMsges = undefined;
    this.errorMessage = '';
    if (!this.user) return;
    this.formChangePass.disable();
    this.loading = true;
    let resp: any = undefined;
    const data = this.formChangePass.value;
    try {
      if (data.password !== data.confirmPassword)
        throw {errorMessage: 'Passwords are not equal', status: 0};
      resp = await this.userSV.changeUserPassword(this.user.id, data);
    } catch(err: any) {
      setTimeout(() => {
        this.errorMsges = err.formErrors;
        this.errorMessage = err.errorMessage;
      }, TIMEOUT);
    } finally {
      setTimeout(() => {
        if (resp !== undefined) {
          this.formChangePass.reset();
          this.ref.close({changed: true});
          this.messageSV.add({
            key: 'main-toast',
            severity: 'success',
            detail: resp.message,
            summary: resp.title,
            life: 3000
          });
        }
        this.formChangePass.enable();
        this.loading = false;
      }, TIMEOUT);
    }

  }
  private buildForm() {
    this.formChangePass = this.formBuilder.group({
      password: [
        null ,
        [
          Validators.required,
          Validators.minLength(3)
        ]
      ],
      confirmPassword: [
        null ,
        [
          Validators.required,
          Validators.minLength(3)
        ]
      ]
    });
  }
}

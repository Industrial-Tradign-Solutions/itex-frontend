import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LayoutService } from '../../layout/layout.service';
import { AuthService, PermissionService } from '@services/security';
import { Title } from '@angular/platform-browser';
import { StaticListsService, StorageService } from '@services/util';
import { storageKeys } from '../../../environments';
import { LoginType } from '@config/types/auth';
import { environment } from '../../../environments/environment';


const URL_NAVIGATE_CONFIG = storageKeys.config.urlNavigate;
const TIMEOUT = environment.timeout;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  private staticListsSV = inject(StaticListsService);

  loading: boolean = false;
  error: string = '';

  loginForm: FormGroup = this.formBuilder.group({
    username: [
      null ,
      [
        Validators.required,
        Validators.minLength(3)
      ]
    ],
    password: [
      null,
      [
        Validators.required,
        Validators.minLength(5)
      ]
    ]
  });

  loginRoute = '/p/dashboard';

  constructor(
    private layoutSV: LayoutService,
    private formBuilder: FormBuilder,
    private authSV: AuthService,
    private permissionSV: PermissionService,
    private storageSV: StorageService

  ) {
    inject(Title).setTitle(`ITEX - Login`);
    localStorage.removeItem('LOGOUT');
    let route = this.storageSV.getPlain<string>(URL_NAVIGATE_CONFIG);
    if(route) {
      this.loginRoute = route;
      this.storageSV.delete(URL_NAVIGATE_CONFIG);
    }
  }

  async onSubit() {
    this.loading = true;
    this.loginForm.disable();
    let isValidLogin: boolean = false;
    try {
      const data: LoginType = this.loginForm.value;
      isValidLogin = await this.authSV.login(data);
      await this.permissionSV.loadUserActions();
      await this.permissionSV.loadUserMenus();
    } catch (err: any) {
      this.error = `${err.errorMessage}`;
    } finally {
      setTimeout(() => {
        if (isValidLogin) {
          this.loginForm.reset();
          setTimeout(() => {
            this.authSV.router.navigateByUrl(this.loginRoute, {replaceUrl: true}).then(() => this.loading = false);
          }, this.loginRoute === '/p/dashboard' ? 1 : TIMEOUT);
          this.staticListsSV.loadStaticList();
        } else {
          this.loginForm.enable();
          this.loginForm.controls['password'].setValue(null);
          this.loading = false;
        }
      }, TIMEOUT);
    }
  }

  get filledInput(): boolean {
		return this.layoutSV.config.inputStyle === 'filled';
	}

}


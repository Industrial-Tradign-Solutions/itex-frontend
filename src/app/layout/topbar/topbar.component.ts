import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { LayoutService } from '../layout.service';
import { storageKeys } from '../../../environments/storage-keys';
import { StorageService } from '../../services/util/storage.service';
import { AuthService } from '../../services/security/auth.service';
import { UserInfo } from '@interfaces/administration/user';
import { finalize } from 'rxjs';
import { UsersService } from '@services/admin';
import { DialogService } from 'primeng/dynamicdialog';
import { ProfileModalComponent } from '@modals/users/profile-modal/profile-modal.component';


const USER_DATA_KEY = storageKeys.user_data.info;
const DARK_MODE_KEY = storageKeys.dark_mode;

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styles: []
})
export class TopbarComponent implements OnInit{
  menu: MenuItem[] = [];

  @ViewChild('searchinput') searchInput!: ElementRef;

  @ViewChild('menubutton') menuButton!: ElementRef;

  darkMode = false;
  profilePhoto!: string;
  userData!: UserInfo;

  constructor(
    public layoutService: LayoutService,
    private storageSV: StorageService,
    private authSV: AuthService,
    private userSV: UsersService,
    private dialogSV: DialogService
  ) {
    this.storageSV.get(USER_DATA_KEY).then(data => this.userData = data);
    this.storageSV.get(DARK_MODE_KEY).then(data => this.darkMode = data);
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.userSV.getProfilePhoto(this.userData.id).subscribe(photo => {
        this.profilePhoto = URL.createObjectURL(photo);
      });
    }, 50);
  }

  openModalProfile() {
    if (!this.userData) return;
    let modal = this.dialogSV.open(ProfileModalComponent, {
      header: 'PROFILE',
      width: '30rem',
      closable: false,
      closeOnEscape: false,
      data: {
        userData : this.userData
      }
    });
    modal.onClose.subscribe((resp) => {
      if (resp && resp.valid) {
        this.userSV.getProfilePhoto(this.userData.id).subscribe(photo => {
          this.profilePhoto = URL.createObjectURL(photo);
        });
      }
    })
  }

  onMenuButtonClick() {
      this.layoutService.onMenuToggle();
  }

  logoutAction() {
    this.authSV.logoutBackendAction()
    .pipe(finalize(() => this.authSV.logoutAction()))
    .subscribe();
  }

  darkModeAction() {
    this.darkMode = !this.darkMode;
    this.storageSV.set(DARK_MODE_KEY, this.darkMode);
    if (this.darkMode) {
      document.getElementById('theme-link')?.setAttribute('href', 'assets/layout/styles/theme/theme-dark/orange/theme.css');
    } else {
      document.getElementById('theme-link')?.setAttribute('href', 'assets/layout/styles/theme/theme-light/orange/theme.css');
    }
  }

  get layoutTheme(): string {
      return this.layoutService.config.layoutTheme;
  }

  get colorScheme(): string {
      return this.layoutService.config.colorScheme;
  }
}

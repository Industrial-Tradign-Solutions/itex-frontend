import { Component, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { storageKeys } from '../../../environments/storage-keys';
import { SidebarComponent } from '@layout/sidebar/sidebar.component';
import { TopbarComponent } from '@layout/topbar/topbar.component';
import { MenuService } from '@layout/menu.service';
import { LayoutService } from '@layout/layout.service';
import { StorageService, WebSocketService } from '@services/util';
import { AuthService } from '@services/security';
import { TabCloseEvent } from '@layout/api/tabcloseevent';
import { ChangePasswordModalComponent } from '@modals/administration/users/change-password-modal/change-password-modal.component';
import { UserInfo } from '@interfaces/administration/user';
import { WebSocketMessage } from '@interfaces/webSocketMessage.model';
import { Messages, TitlesMessages } from '@config/messages';

const USER_DATA_KEY = storageKeys.user_data.info;
const TITLE_MESSAGES = TitlesMessages;
const MESSAGES = Messages.config.web_socket;

@Component({
  selector: 'app-principal',
  templateUrl: './principal.component.html',
  styles: ``
})
export class PrincipalComponent implements OnDestroy, OnInit {

  overlayMenuOpenSubscription: Subscription;

  tabOpenSubscription: Subscription;

  tabCloseSubscription: Subscription;

  menuOutsideClickListener: any;

  menuScrollListener: any;

  @ViewChild(SidebarComponent) appSidebar!: SidebarComponent;

  @ViewChild(TopbarComponent) appTopbar!: TopbarComponent;

  modalChangePassRef!: DynamicDialogRef;

  constructor(
    private menuService: MenuService,
    public layoutService: LayoutService,
    public renderer: Renderer2,
    public router: Router,
    private storageSV: StorageService,
    private authSV: AuthService,
    private dialogSV: DialogService,
    private messageSV: MessageService,
    private socketSV: WebSocketService
) {
      this.overlayMenuOpenSubscription = this.layoutService.overlayOpen$.subscribe(() => {
          if (!this.menuOutsideClickListener) {
              this.menuOutsideClickListener = this.renderer.listen('document', 'click', event => {
                  const isOutsideClicked = !(this.appSidebar.el.nativeElement.isSameNode(event.target) || this.appSidebar.el.nativeElement.contains(event.target)
                  || this.appTopbar.menuButton.nativeElement.isSameNode(event.target) || this.appTopbar.menuButton.nativeElement.contains(event.target));
                  if (isOutsideClicked) {
                      this.hideMenu();
                  }
              });
          }

          if ((this.layoutService.isSlim() || this.layoutService.isSlimPlus()) && !this.menuScrollListener) {
              this.menuScrollListener = this.renderer.listen(this.appSidebar.menuContainer.nativeElement, 'scroll', event => {
                  if (this.layoutService.isDesktop()) {
                      this.hideMenu();
                  }
              });
          }

          if (this.layoutService.state.staticMenuMobileActive) {
              this.blockBodyScroll();
          }
      });

      this.router.events.pipe(filter(event => event instanceof NavigationEnd))
          .subscribe(() => {
              this.hideMenu();
          });

      this.tabOpenSubscription = this.layoutService.tabOpen$.subscribe(tab => {
          this.router.navigate(tab.routerLink);
          this.layoutService.openTab(tab);
      });

      this.tabCloseSubscription = this.layoutService.tabClose$.subscribe((event: TabCloseEvent) => {
          if (this.router.isActive(event.tab.routerLink[0], { paths: 'subset', queryParams: 'subset', fragment: 'ignored', matrixParams: 'ignored'})) {
              const tabs = this.layoutService.tabs;

              if (tabs.length > 1) {
                  if (event.index === (tabs.length - 1))
                      this.router.navigate(tabs[tabs.length - 2].routerLink);
                  else
                      this.router.navigate(tabs[event.index + 1].routerLink);
              }
              else {
                  this.router.navigate(['/']);
              }
          }

          this.layoutService.closeTab(event.index);
      });

  }

  private interval: any;
  private userData!: UserInfo;

  private socketObs: Subscription | null = null;

  ngOnInit(): void {
    this.storageSV.get(USER_DATA_KEY).then(async (user: UserInfo) => {
        this.userData = user;
        if (!user.passChanged) {
            this.modalChangePassRef = this.dialogSV.open(ChangePasswordModalComponent,
                {
                    header: 'CHANGE PASSWORD',
                    closable: false,
                    width: '30rem',
                    data: {
                        user
                    }
                }
            );
            this.modalChangePassRef.onClose.subscribe(resp => {
                if (resp.changed) {
                    user.passChanged = true;
                    this.storageSV.set(USER_DATA_KEY, user);
                }
            });
        }
    });
    this.validateSession();
    this.socketConnection();
  }

  private socketConnection() {
    while(this.socketObs === null) {
        this.socketObs = this.socketSV.connect().subscribe({
            next: (resp: WebSocketMessage) => {
              if (resp.webSocketMessageType === 'ERROR' && resp.webSocketMessageValue === 'ERROR_SOCKET') {
                console.error(resp);
                if (this.socketObs !== null)
                    this.socketObs.unsubscribe();
              } else {
                this.socketSV.socketTransformData(resp);
              }
            },
            error: err => {
              console.error(err);
              if (this.socketObs !== null)
                  this.socketObs.unsubscribe();
              this.socketObs = null;
              this.socketConnection();
            }
        });
    }
  }



  private validateSession() {
    this.interval = setInterval(() => {
        this.authSV.isTokenExpired().then((resp: boolean) => {
            if (resp) {
                this.messageSV.add({
                    key: 'main-toast',
                    severity: 'warn',
                    detail: MESSAGES.session_ended,
                    summary: TITLE_MESSAGES.session_ended,
                    closable: false,
                    life: 10000
                });
                setTimeout(() => {
                    this.authSV.logoutAction();
                    setTimeout(() => {
                      window.location.reload();
                    }, 300);
                }, 10000);
            }
        });
        if (this.userData) {
            const actualDate = new Date();
            this.userData.expirationToken = new Date(this.userData.expirationToken);
            const difMillis = this.userData.expirationToken.getTime() - actualDate.getTime();
            const minutsEnd = difMillis / (1000 * 60);
            if (minutsEnd <= 5) {
                this.messageSV.add({
                    key: 'main-toast',
                    severity: 'info',
                    detail: MESSAGES.end_session(parseFloat(minutsEnd.toFixed(1))),
                    summary: TITLE_MESSAGES.session_timeout,
                    closable: false,
                    life: 60000
                });
            }
        }
    }, 120000);
  }

  blockBodyScroll(): void {
      if (document.body.classList) {
          document.body.classList.add('blocked-scroll');
      }
      else {
          document.body.className += ' blocked-scroll';
      }
  }

  unblockBodyScroll(): void {
      if (document.body.classList) {
          document.body.classList.remove('blocked-scroll');
      }
      else {
          document.body.className = document.body.className.replace(new RegExp('(^|\\b)' +
              'blocked-scroll'.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
      }
  }

  hideMenu() {
      this.layoutService.state.overlayMenuActive = false;
      this.layoutService.state.staticMenuMobileActive = false;
      this.layoutService.state.menuHoverActive = false;
      this.menuService.reset();
      if(this.menuOutsideClickListener) {
          this.menuOutsideClickListener();
          this.menuOutsideClickListener = null;
      }

      if (this.menuScrollListener) {
          this.menuScrollListener();
          this.menuScrollListener = null;
      }

      this.unblockBodyScroll();
  }

  get containerClass() {
      return {
          'layout-slim': this.layoutService.config.menuMode === 'slim',
          'layout-slim-plus': this.layoutService.config.menuMode === 'slim-plus',
          'layout-static': this.layoutService.config.menuMode === 'static',
          'layout-overlay': this.layoutService.config.menuMode === 'overlay',
          'layout-overlay-active': this.layoutService.state.overlayMenuActive,
          'layout-mobile-active': this.layoutService.state.staticMenuMobileActive,
          'layout-static-inactive': this.layoutService.state.staticMenuDesktopInactive && this.layoutService.config.menuMode === 'static',
          'p-input-filled': this.layoutService.config.inputStyle === 'filled',
          'p-ripple-disabled': !this.layoutService.config.ripple,
          'layout-light': this.layoutService.config.layoutTheme === 'colorScheme' && this.layoutService.config.colorScheme === 'light',
          'layout-dark': this.layoutService.config.layoutTheme === 'colorScheme' && this.layoutService.config.colorScheme === 'dark',
          'layout-primary': this.layoutService.config.colorScheme !== 'dark' && this.layoutService.config.layoutTheme === 'primaryColor'
      }
  }

  ngOnDestroy() {
      if (this.overlayMenuOpenSubscription) {
          this.overlayMenuOpenSubscription.unsubscribe();
      }

      if (this.menuOutsideClickListener) {
          this.menuOutsideClickListener();
      }

      if (this.tabOpenSubscription) {
          this.tabOpenSubscription.unsubscribe();
      }

      if (this.tabCloseSubscription) {
          this.tabCloseSubscription.unsubscribe();
      }
      clearInterval(this.interval);
      if (this.socketObs !== null)
          this.socketObs.unsubscribe();
  }
}


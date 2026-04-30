import { inject, Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from '../../../environments/environment';
import { AuthService } from '@services/security';
import { WebSocketMessage } from '@interfaces/webSocketMessage.model';
import { StorageService } from './storage.service';
import { UserInfo } from '@interfaces/administration/user';
import { storageKeys } from '../../../environments';
import { UtilService } from './util.service';
import { Messages, TitlesMessages } from '@config/messages';


const SOCKET_URL = environment.webSocket_url;
const TITLE_MESSAGES = TitlesMessages;
const MESSAGES = Messages.config.web_socket;

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {

  private storageSV = inject(StorageService);
  private utilSV    = inject(UtilService);

  private socket$!: WebSocketSubject<any>;

  constructor(private authSV: AuthService) {
    this.authSV.getToken().then(token => {
      this.socket$ = webSocket(`${SOCKET_URL}?token=${token}`);
    });
  }
  connect() {
    return this.socket$.asObservable();
  }

  socketTransformData(message: WebSocketMessage) {
    switch(message.webSocketMessageType) {
      case 'LIST':
        this.configSocketMessageList(message);
        break;
      case 'ERROR':

        break;
      case 'NOTIFICATION':

        break;
      case 'LOGOUT':
        this.configSocketMessageLogout(message);
        break;
      default:
        console.warn('No Existe el tipo');
        break;
    }
  }

  private configSocketMessageLogout(message: WebSocketMessage) {
    if (message.webSocketMessageValue === 'CLOSE_ALL_SESSIONS') {
      this.closeSessionAction(message.data);
    } else if (message.webSocketMessageValue === 'NOTIFICATION_LOGOUT') {
      this.utilSV.setMessage(TITLE_MESSAGES.notification, message.data,'warn');
    } else {
      const user = this.storageSV.getPlain<UserInfo>(storageKeys.user_data.info);
      if (user === null) return;

      if (user.id === message.data.userId) {
        switch(message.webSocketMessageValue) {
          case 'NEW_LOGIN':
            const token = this.storageSV.getPlain<string>(storageKeys.user_data.token);
            if (token !== message.data.token) {
              this.closeSessionAction(MESSAGES.login_other_device);
            }
            break;
          case 'DISABLE_USER':
            this.closeSessionAction(MESSAGES.disable('user'), true);
            break;
          case 'DISABLE_ROLE':
            this.closeSessionAction(MESSAGES.disable('role'), true);
            break;
          default:
            break;
        }
      }
    }
  }

  private closeSessionAction(message: string, closeOrders: boolean = false) {
    this.utilSV.setMessage(TITLE_MESSAGES.session_ended, message, 'warn');
    setTimeout(() => {
      if (closeOrders) {
        this.authSV.logoutBackendAction().subscribe({
          next : () => this.authSV.logoutAction()
        });
      } else {
        this.authSV.logoutAction();
      }
    }, 5000);
  }

  private configSocketMessageList(message: WebSocketMessage) {
    this.storageSV.set(message.webSocketMessageValue, message.data);

    if (message.webSocketMessageValue === storageKeys.lists.list_departmens || message.webSocketMessageValue === storageKeys.lists.list_roles)
      this.storageSV.delete(storageKeys.lists.list_users);
  }
}

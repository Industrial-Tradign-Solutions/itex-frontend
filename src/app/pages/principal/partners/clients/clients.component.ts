import { Component, computed, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonTabs } from '../../../../config/tabs/commonTabsOpen';
import { ClientsService } from '@services/partners/clients.service';
import { PermissionService } from '@services/security';
import { moduleActionsId } from '../../../../../environments';
import { TabViewCloseEvent } from 'primeng/tabview';
import { ListClients } from '@interfaces/partners/clients';

const CLIENTS_ACTIONS_ID = moduleActionsId.partners.clients;

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss'
})
export class ClientsComponent extends CommonTabs<ListClients> implements OnInit, OnDestroy {

  constructor() {super('Clients'); }

  //! Inyecciones
  private permissionsSV  = inject(PermissionService);
  private clientsSV      = inject(ClientsService);
  //! ----------------------------------------------------------

  //* Señales
  private _clientPermissions = signal<ClientPermissions>({
    createClient: false,
    updateClient: false,
    changeStatusClient: false,
    changeTargetClientInfo: false
  });
  clientPermissions = computed<ClientPermissions>(() => this._clientPermissions());
  //* -----------------------------------------------------------

  ngOnInit(): void {
    this._loading.set(true);
    this.loadListPermissionsClients();
    if (!this.isOpenModule) {
      this.loadOpenClients();
    }
  }

  loadOpenClients() {
    this.clientsSV.loadOpenClients().subscribe({
      next: resp => {
        if (resp && resp.length > 0) {
          this.openModalConfirmationOpenClose(resp, this.clientsSV.closeListClients(resp.map(prospect => prospect.id)));
        } else {
          this._loading.set(false)
        }
      }
    });
  }

  closeTab(event: TabViewCloseEvent | {index: number}) {
    this.closeTabAction(event, this.clientsSV.closeClient(this.tabs()[event.index - 1].item.id));
  }

  private async loadListPermissionsClients() {
    this._clientPermissions.set({
      createClient: await this.permissionsSV.isValidAction(CLIENTS_ACTIONS_ID.CREATE_CLIENT),
      updateClient: await this.permissionsSV.isValidAction(CLIENTS_ACTIONS_ID.UPDATE_CLIENT),
      changeStatusClient: await this.permissionsSV.isValidAction(CLIENTS_ACTIONS_ID.CHANGE_STATUS_CLIENT),
      changeTargetClientInfo: await this.permissionsSV.isValidAction(CLIENTS_ACTIONS_ID.CHANGE_TARGET_CLIENT_INFO),
    });
  }

  ngOnDestroy(): void {
    this.destroyPage();
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification(event: any): void {
    this.destroyPage();
  }

  private destroyPage() {
    const items = this.tabs().map(item => item.item.id);
    if (items.length > 0) {
      this.dismissNavTab(this.clientsSV.closeListClients(items));
    } else {
      this.dismissNavTab(undefined);
    }
  }
}

export type ClientPermissions = {
  updateClient: boolean;
  createClient: boolean;
  changeStatusClient: boolean;
  changeTargetClientInfo: boolean;
}

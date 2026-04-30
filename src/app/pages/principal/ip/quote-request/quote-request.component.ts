import { Component, computed, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { moduleActionsId } from '../../../../../environments';
import { CommonTabs } from '@config/tabs/commonTabsOpen';
import { ListIpQuoteRequest } from '@interfaces/ip/quoteRequest';
import { PermissionService } from '@services/security';
import { IpQuoteRequestService } from '@services/ip';
import { TabViewCloseEvent } from 'primeng/tabview';

const IP_QUOTE_REQUESTS_ACTIONS_ID = moduleActionsId.ip.quote_requests;

@Component({
  selector: 'app-quote-request',
  templateUrl: './quote-request.component.html',
  styleUrl: './quote-request.component.scss'
})
export class QuoteRequestComponent extends CommonTabs<ListIpQuoteRequest> implements OnDestroy, OnInit{
  constructor() {
    super('Quote_Requests')
  }

  //! Inyecciones
  private permissionsSV      = inject(PermissionService);
  private ipQuoteRequestSV   = inject(IpQuoteRequestService);
  //! ----------------------------------------------------------

  //* Señales
  private _ipQuoteRequestPermissions = signal<IpQuoteRequestPermissions>({
    createIpQuoteRequest: false,
    updateIpQuoteRequest: false,
    viewHistoryIpQuoteRequest: false,
    cloneIpQuoteRequest: false,
    rejectIpQuoteRequest: false,
    editPaymentTermsIpQuoteRequest: false
  });
  ipQuoteRequestPermissions = computed<IpQuoteRequestPermissions>(() => this._ipQuoteRequestPermissions());
  //* -----------------------------------------------------------

  ngOnInit(): void {
    this._loading.set(true);
    this.loadListPermissionsIpQuoteRequest();
    if (!this.isOpenModule) {
      this.loadOpenIpQuoteRequests();
    }
  }

  ngOnDestroy(): void {
    this.destroyPage();
  }

  loadOpenIpQuoteRequests() {
    this.ipQuoteRequestSV.loadOpenQuoteRequests().subscribe({
      next: resp => {
        if (resp && resp.length > 0) {
          this.openModalConfirmationOpenClose(resp, this.ipQuoteRequestSV.closeListQuoteRequests(resp.map(quoteRequest => quoteRequest.id)));
        } else {
          this._loading.set(false)
        }
      }
    });
  }

  closeTab(event: TabViewCloseEvent | {index: number}) {
    this.closeTabAction(event, this.ipQuoteRequestSV.closeQuoteRequest(this.tabs()[event.index - 1].item.id));
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification(event: any): void {
    this.destroyPage();
  }

  private destroyPage() {
    const items = this.tabs().map(item => item.item.id);
    if (items.length > 0) {
      this.dismissNavTab(this.ipQuoteRequestSV.closeListQuoteRequests(items));
    } else {
      this.dismissNavTab(undefined);
    }
  }

  private async loadListPermissionsIpQuoteRequest() {
    this._ipQuoteRequestPermissions.set({
      createIpQuoteRequest: await this.permissionsSV.isValidAction(IP_QUOTE_REQUESTS_ACTIONS_ID.CREATE_IP_QUOTE_REQUESTS),
      updateIpQuoteRequest: await this.permissionsSV.isValidAction(IP_QUOTE_REQUESTS_ACTIONS_ID.UPDATE_IP_QUOTE_REQUESTS),
      viewHistoryIpQuoteRequest: await this.permissionsSV.isValidAction(IP_QUOTE_REQUESTS_ACTIONS_ID.VIEW_HISTORY_IP_QUOTE_REQUESTS),
      cloneIpQuoteRequest: await this.permissionsSV.isValidAction(IP_QUOTE_REQUESTS_ACTIONS_ID.CLONE_IP_QUOTE_REQUESTS),
      rejectIpQuoteRequest: await this.permissionsSV.isValidAction(IP_QUOTE_REQUESTS_ACTIONS_ID.REJECT_IP_QUOTE_REQUESTS),
      editPaymentTermsIpQuoteRequest: await this.permissionsSV.isValidAction(IP_QUOTE_REQUESTS_ACTIONS_ID.EDIT_PAYMENT_TERMS_IP_QUOTE_REQUESTS),
    });
  }

}

export type IpQuoteRequestPermissions = {
  createIpQuoteRequest: boolean;
  updateIpQuoteRequest: boolean;
  viewHistoryIpQuoteRequest: boolean;
  cloneIpQuoteRequest: boolean;
  rejectIpQuoteRequest: boolean;
  editPaymentTermsIpQuoteRequest: boolean;
}

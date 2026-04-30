import { Component, computed, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { moduleActionsId } from '../../../../../environments';
import { CommonTabs } from '@config/tabs/commonTabsOpen';
import { PermissionService } from '@services/security';
import { IpQuotationService } from '@services/ip';
import { TabViewCloseEvent } from 'primeng/tabview';
import { ListIpQuotation } from '@interfaces/ip/quotation';

const IP_QUOTATION_ACTIONS_ID = moduleActionsId.ip.quotations;

@Component({
  selector: 'app-quotations',
  templateUrl: './quotations.component.html',
  styleUrl: './quotations.component.scss'
})
export class QuotationsComponent extends CommonTabs<ListIpQuotation> implements OnDestroy, OnInit {

  constructor() {
    super('Quotations')
  }

  //! Inyecciones
  private permissionsSV      = inject(PermissionService);
  private ipQuotationSV      = inject(IpQuotationService);
  //! ----------------------------------------------------------

  //* Señales
  private _ipQuotationPermissions = signal<IpQuotationPermissions>({
    createIpQuotation: false,
    updateIpQuotation: false,
    viewHistoryIpQuotation: false,
    cloneIpQuotation: false,
    rejectIpQuotation: false,
    editPaymentTermsIpQuotation: false
  });
  ipQuotationPermissions = computed<IpQuotationPermissions>(() => this._ipQuotationPermissions());
  //* -----------------------------------------------------------

  ngOnInit(): void {
    this._loading.set(true);
    this.loadListPermissionsIpQuotation();
    if (!this.isOpenModule) {
      this.loadOpenIpQuotations();
    }
  }

  ngOnDestroy(): void {
    this.destroyPage();
  }

  loadOpenIpQuotations() {
    this.ipQuotationSV.loadOpenQuotations().subscribe({
      next: resp => {
        if (resp && resp.length > 0) {
          this.openModalConfirmationOpenClose(resp, this.ipQuotationSV.closeListQuotations(resp.map(Quotation => Quotation.id)));
        } else {
          this._loading.set(false)
        }
      }
    });
  }

  closeTab(event: TabViewCloseEvent | {index: number}) {
    this.closeTabAction(event, this.ipQuotationSV.closeQuotation(this.tabs()[event.index - 1].item.id));
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification(event: any): void {
    this.destroyPage();
  }

  private destroyPage() {
    const items = this.tabs().map(item => item.item.id);
    if (items.length > 0) {
      this.dismissNavTab(this.ipQuotationSV.closeListQuotations(items));
    } else {
      this.dismissNavTab(undefined);
    }
  }

  private async loadListPermissionsIpQuotation() {
    this._ipQuotationPermissions.set({
      createIpQuotation: await this.permissionsSV.isValidAction(IP_QUOTATION_ACTIONS_ID.CREATE_IP_QUOTATION),
      updateIpQuotation: await this.permissionsSV.isValidAction(IP_QUOTATION_ACTIONS_ID.UPDATE_IP_QUOTATION),
      viewHistoryIpQuotation: await this.permissionsSV.isValidAction(IP_QUOTATION_ACTIONS_ID.VIEW_HISTORY_IP_QUOTATION),
      cloneIpQuotation: await this.permissionsSV.isValidAction(IP_QUOTATION_ACTIONS_ID.CLONE_IP_QUOTATION),
      rejectIpQuotation: await this.permissionsSV.isValidAction(IP_QUOTATION_ACTIONS_ID.REJECT_IP_QUOTATION),
      editPaymentTermsIpQuotation: await this.permissionsSV.isValidAction(IP_QUOTATION_ACTIONS_ID.EDIT_PAYMENT_TERMS_IP_QUOTATION),
    });
  }
}

export type IpQuotationPermissions = {
  createIpQuotation: boolean;
  updateIpQuotation: boolean;
  viewHistoryIpQuotation: boolean;
  cloneIpQuotation: boolean;
  rejectIpQuotation: boolean;
  editPaymentTermsIpQuotation: boolean;
}

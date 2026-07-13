import { Component, computed, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { moduleActionsId } from '../../../../../environments';
import { CommonTabs } from '@config/tabs/commonTabsOpen';
import { ListIpPurchaseOrder } from '@interfaces/ip/purchaseOrder';
import { PermissionService } from '@services/security';
import { IpPurchaseOrderService } from '@services/ip';
import { TabViewCloseEvent } from 'primeng/tabview';

const IP_PURCHASE_ORDERS_ACTIONS_ID = moduleActionsId.ip.purchase_order;

@Component({
  selector: 'app-purchase-order',
  templateUrl: './purchase-order.component.html',
  styleUrl: './purchase-order.component.scss'
})
export class PurchaseOrderComponent extends CommonTabs<ListIpPurchaseOrder> implements OnDestroy, OnInit {
  constructor() {
    super('Purchase_Orders')
  }

  private permissionsSV          = inject(PermissionService);
  private ipPurchaseOrderSV      = inject(IpPurchaseOrderService);

  private _ipPurchaseOrderPermissions = signal<IpPurchaseOrderPermissions>({
    createPurchaseOrder: false,
    updatePurchaseOrder: false,
    viewHistoryPurchaseOrder: false,
    rejectPurchaseOrder: false,
    editPaymentTermsPurchaseOrder: false,
    clonePurchaseOrder: false
  });
  ipPurchaseOrderPermissions = computed<IpPurchaseOrderPermissions>(() => this._ipPurchaseOrderPermissions());

  ngOnInit(): void {
    this._loading.set(true);
    this.loadListPermissionsIpPurchaseOrder();
    if (!this.isOpenModule) {
      this.loadOpenIpPurchaseOrders();
    }
  }

  ngOnDestroy(): void {
    this.destroyPage();
  }

  loadOpenIpPurchaseOrders() {
    this.ipPurchaseOrderSV.loadOpenPurchaseOrders().subscribe({
      next: resp => {
        if (resp && resp.length > 0) {
          this.openModalConfirmationOpenClose(resp, this.ipPurchaseOrderSV.closeListPurchaseOrders());
        } else {
          this._loading.set(false)
        }
      }
    });
  }

  closeTab(event: TabViewCloseEvent | { index: number }) {
    this.closeTabAction(event, this.ipPurchaseOrderSV.closePurchaseOrder(this.tabs()[event.index - 1].item.id));
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification(event: any): void {
    this.destroyPage();
  }

  private destroyPage() {
    const items = this.tabs().map(item => item.item.id);
    if (items.length > 0) {
      this.dismissNavTab(this.ipPurchaseOrderSV.closeListPurchaseOrders());
    } else {
      this.dismissNavTab(undefined);
    }
  }

  private async loadListPermissionsIpPurchaseOrder() {
    this._ipPurchaseOrderPermissions.set({
      createPurchaseOrder: await this.permissionsSV.isValidAction(IP_PURCHASE_ORDERS_ACTIONS_ID.CREATE_PURCHASE_ORDER),
      updatePurchaseOrder: await this.permissionsSV.isValidAction(IP_PURCHASE_ORDERS_ACTIONS_ID.UPDATE_PURCHASE_ORDER),
      viewHistoryPurchaseOrder: await this.permissionsSV.isValidAction(IP_PURCHASE_ORDERS_ACTIONS_ID.VIEW_HISTORY_PURCHASE_ORDER),
      rejectPurchaseOrder: await this.permissionsSV.isValidAction(IP_PURCHASE_ORDERS_ACTIONS_ID.REJECT_PURCHASE_ORDER),
      editPaymentTermsPurchaseOrder: await this.permissionsSV.isValidAction(IP_PURCHASE_ORDERS_ACTIONS_ID.EDIT_PAYMENT_TERMS_PURCHASE_ORDER),
      clonePurchaseOrder: await this.permissionsSV.isValidAction(IP_PURCHASE_ORDERS_ACTIONS_ID.CLONE_PURCHASE_ORDER),
    });
  }

}

export type IpPurchaseOrderPermissions = {
  createPurchaseOrder: boolean;
  updatePurchaseOrder: boolean;
  viewHistoryPurchaseOrder: boolean;
  rejectPurchaseOrder: boolean;
  editPaymentTermsPurchaseOrder: boolean;
  clonePurchaseOrder: boolean;
}

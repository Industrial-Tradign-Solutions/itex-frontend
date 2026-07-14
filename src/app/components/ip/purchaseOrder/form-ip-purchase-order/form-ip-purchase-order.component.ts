import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { CommonPageTab } from '@config/tabs/commonPageTab';
import { EmitedTab } from '@config/types/tabs';
import { ListIpPurchaseOrder, IpPurchaseOrder } from '@interfaces/ip/purchaseOrder';
import { IpPurchaseOrderPermissions } from '@pages/principal/ip/purchase-order/purchase-order.component';
import { Messages } from '@config/messages';
import { IpPurchaseOrderService } from '@services/ip';

const MESSAGES = Messages.pages.ip.purchaseOrder;

@Component({
  selector: 'app-form-ip-purchase-order',
  templateUrl: './form-ip-purchase-order.component.html',
  styleUrl: './form-ip-purchase-order.component.scss'
})
export class FormIpPurchaseOrderComponent extends CommonPageTab<ListIpPurchaseOrder, IpPurchaseOrderPermissions, IpPurchaseOrder> implements OnInit {

  private ipPurchaseOrderSV = inject(IpPurchaseOrderService);

  @Output() opened = new EventEmitter<EmitedTab<ListIpPurchaseOrder>>();

  constructor() {
    super(MESSAGES);
  }

  ngOnInit(): void {
    if (this.tabItem.item.status === 'COMPLETE' || this.tabItem.item.status === 'REJECTED') {
      this.tabItem.type = 'view';
    }
    this.onInitAction({
      updatePermission: this.permissions().updatePurchaseOrder,
      openAndLock: this.ipPurchaseOrderSV.openAndLockPurchaseOrder(this.tabItem.item.id, this.tabItem.type),
      module: 'PO'
    });
  }

  protected override getRequest() {
    return {};
  }

  protected override buildFormAction(): void {
    this.formTab = this.formBuilder.group({});
  }

  protected override enableForm(): void {
  }

  override onSubmit(): void {
    this.utilSV.setMessage('Info', 'Function not implemented', 'info');
  }
}

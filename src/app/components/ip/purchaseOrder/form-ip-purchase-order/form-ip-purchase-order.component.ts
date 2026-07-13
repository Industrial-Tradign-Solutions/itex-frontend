import { Component, EventEmitter, Output } from '@angular/core';
import { CommonPageTab } from '@config/tabs/commonPageTab';
import { EmitedTab } from '@config/types/tabs';
import { ListIpPurchaseOrder, IpPurchaseOrder } from '@interfaces/ip/purchaseOrder';
import { IpPurchaseOrderPermissions } from '@pages/principal/ip/purchase-order/purchase-order.component';
import { Messages } from '@config/messages';

const MESSAGES = Messages.pages.ip.purchaseOrder;

@Component({
  selector: 'app-form-ip-purchase-order',
  templateUrl: './form-ip-purchase-order.component.html',
  styleUrl: './form-ip-purchase-order.component.scss'
})
export class FormIpPurchaseOrderComponent extends CommonPageTab<ListIpPurchaseOrder, IpPurchaseOrderPermissions, IpPurchaseOrder> {

  @Output() opened = new EventEmitter<EmitedTab<ListIpPurchaseOrder>>();

  constructor() {
    super(MESSAGES);
  }

  protected override getRequest() {
    return {};
  }

  protected override buildFormAction(): void {
  }

  protected override enableForm(): void {
  }

  override onSubmit(): void {
  }
}

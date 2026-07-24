import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PurchaseOrderRoutingModule } from './purchase-order-routing.module';
import { PurchaseOrderComponent } from './purchase-order.component';
import { TabViewModule } from 'primeng/tabview';
import { SkeletonModule } from 'primeng/skeleton';
import { OpenCloseConfirmationModalModule } from '@modals/util/open-close-confirmation-modal/open-close-confirmation-modal.module';
import { ListIpPurchaseOrderModule } from '@components/ip/purchaseOrder/list-ip-purchase-order/list-ip-purchase-order.module';
import { FormIpPurchaseOrderModule } from '@components/ip/purchaseOrder/form-ip-purchase-order/form-ip-purchase-order.module';


@NgModule({
  declarations: [
    PurchaseOrderComponent
  ],
  imports: [
    CommonModule,
    PurchaseOrderRoutingModule,
    TabViewModule,
    SkeletonModule,
    OpenCloseConfirmationModalModule,
    ListIpPurchaseOrderModule,
    FormIpPurchaseOrderModule
  ]
})
export class PurchaseOrderModule { }

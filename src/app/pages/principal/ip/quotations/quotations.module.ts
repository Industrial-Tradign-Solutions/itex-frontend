import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { QuotationsRoutingModule } from './quotations-routing.module';
import { QuotationsComponent } from './quotations.component';
import { ListIpQuotationModule } from '@components/ip/quotations/list-ip-quotation/list-ip-quotation.module';
import { FormIpQuotationModule } from '@components/ip/quotations/form-ip-quotation/form-ip-quotation.module';
import { OpenCloseConfirmationModalModule } from '@modals/util/open-close-confirmation-modal/open-close-confirmation-modal.module';
import { SkeletonModule } from 'primeng/skeleton';
import { TabViewModule } from 'primeng/tabview';


@NgModule({
  declarations: [
    QuotationsComponent
  ],
  imports: [
    CommonModule,
    QuotationsRoutingModule,
    ListIpQuotationModule,
    FormIpQuotationModule,
    TabViewModule,
    SkeletonModule,
    OpenCloseConfirmationModalModule
  ]
})
export class QuotationsModule { }

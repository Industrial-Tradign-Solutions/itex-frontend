import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { QuoteRequestRoutingModule } from './quote-request-routing.module';
import { QuoteRequestComponent } from './quote-request.component';
import { TabViewModule } from 'primeng/tabview';
import { SkeletonModule } from 'primeng/skeleton';
import { OpenCloseConfirmationModalModule } from '@modals/util/open-close-confirmation-modal/open-close-confirmation-modal.module';
import { ListIpQuoteRequestModule } from '@components/ip/quoteRequest/list-ip-quote-request/list-ip-quote-request.module';
import { FormIpQuoteRequestModule } from '@components/ip/quoteRequest/form-ip-quote-request/form-ip-quote-request.module';


@NgModule({
  declarations: [
    QuoteRequestComponent
  ],
  imports: [
    CommonModule,
    QuoteRequestRoutingModule,
    TabViewModule,
    SkeletonModule,
    OpenCloseConfirmationModalModule,
    ListIpQuoteRequestModule,
    FormIpQuoteRequestModule
  ]
})
export class QuoteRequestModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClientsRoutingModule } from './clients-routing.module';
import { ClientsComponent } from './clients.component';
import { ListClientsModule } from '@components/partners/clients/list-clients/list-clients.module';
import { FormClientProspectModule } from '@components/partners/clients/form-client-prospect/form-client-prospect.module';
import { TabViewModule } from 'primeng/tabview';
import { SkeletonModule } from 'primeng/skeleton';
import { OpenCloseConfirmationModalModule } from '@modals/util/open-close-confirmation-modal/open-close-confirmation-modal.module';


@NgModule({
  declarations: [
    ClientsComponent
  ],
  imports: [
    CommonModule,
    ClientsRoutingModule,
    ListClientsModule,
    FormClientProspectModule,
    TabViewModule,
    SkeletonModule,
    OpenCloseConfirmationModalModule
  ]
})
export class ClientsModule { }

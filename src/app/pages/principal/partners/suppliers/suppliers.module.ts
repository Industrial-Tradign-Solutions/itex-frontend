import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SuppliersRoutingModule } from './suppliers-routing.module';
import { SuppliersComponent } from './suppliers.component';
import { TabViewModule } from 'primeng/tabview';
import { SkeletonModule } from 'primeng/skeleton';
import { OpenCloseConfirmationModalModule } from '@modals/util/open-close-confirmation-modal/open-close-confirmation-modal.module';
import { ListSuppliersModule } from '@components/partners/suppliers/list-suppliers/list-suppliers.module';
import { FormSuppliersModule } from '@components/partners/suppliers/form-suppliers/form-suppliers.module';


@NgModule({
  declarations: [
    SuppliersComponent
  ],
  imports: [
    CommonModule,
    SuppliersRoutingModule,
    ListSuppliersModule,
    FormSuppliersModule,
    TabViewModule,
    SkeletonModule,
    OpenCloseConfirmationModalModule
  ]
})
export class SuppliersModule { }

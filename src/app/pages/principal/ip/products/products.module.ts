import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProductsRoutingModule } from './products-routing.module';
import { ProductsComponent } from './products.component';
import { TabViewModule } from 'primeng/tabview';
import { SkeletonModule } from 'primeng/skeleton';
import { OpenCloseConfirmationModalModule } from '@modals/util/open-close-confirmation-modal/open-close-confirmation-modal.module';
import { ListIpProductsModule } from '@components/ip/products/list-ip-products/list-ip-products.module';
import { FormIpProductsModule } from '@components/ip/products/form-ip-products/form-ip-products.module';
import { ImportIpProductsModule } from '@components/ip/products/import-ip-products/import-ip-products.module';


@NgModule({
  declarations: [
    ProductsComponent
  ],
  imports: [
    CommonModule,
    ProductsRoutingModule,
    TabViewModule,
    SkeletonModule,
    OpenCloseConfirmationModalModule,
    ListIpProductsModule,
    FormIpProductsModule,
    ImportIpProductsModule
  ]
})
export class ProductsModule { }

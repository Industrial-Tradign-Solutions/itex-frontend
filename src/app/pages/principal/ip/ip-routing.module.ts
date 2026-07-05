import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IpComponent } from './ip.component';
import { ipProductGuard, ipQuotationGuard, ipQuoteRequestGuard } from '@guards/ip';

const routes: Routes = [
  { path: '',
    component: IpComponent,
    children: [
      {
        path: 'products',
        data: {
          breadcrumb: 'Products'
        },
        loadChildren: () => import('./products/products.module').then(m => m.ProductsModule),
        canActivateChild: [ ipProductGuard ]
      },
      {
        path: 'qr',
        data: {
          breadcrumb: 'Quote Requests'
        },
        loadChildren: () => import('./quote-request/quote-request.module').then(m => m.QuoteRequestModule),
        canActivateChild: [ ipQuoteRequestGuard ]
      },
      {
        path: 'q',
        data: {
          breadcrumb: 'Quotations'
        },
        loadChildren: () => import('./quotations/quotations.module').then(m => m.QuotationsModule),
        canActivateChild: [ ipQuotationGuard ]
      },
      {
        path: '**',
        pathMatch: 'full',
        redirectTo: 'not-found'
      }
    ]
  },


];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IpRoutingModule { }

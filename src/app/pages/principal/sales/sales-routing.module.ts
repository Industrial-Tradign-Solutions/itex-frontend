import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SalesComponent } from './sales.component';
import { invoicesGuard } from '@guards/sales';

const routes: Routes = [
  {
    path: '',
    component: SalesComponent,
    children: [
      {
        path: 'inv',
        data: {
          breadcrumb: 'Invoices'
        },
        loadChildren: () => import('./invoices/invoices.module').then(m => m.InvoicesModule),
        canActivateChild: [ invoicesGuard ]
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
export class SalesRoutingModule { }

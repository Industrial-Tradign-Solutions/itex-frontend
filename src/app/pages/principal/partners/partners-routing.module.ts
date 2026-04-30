import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PartnersComponent } from './partners.component';
import { clientsGuard, suppliersGuard } from '@guards/partners';


const routes: Routes = [
  {
    path: '',
    component: PartnersComponent,
    children: [
      {
        path: 'clients',
        data: {
          breadcrumb: 'Clients'
        },
        loadChildren: () => import('./clients/clients.module').then(m => m.ClientsModule),
        canActivateChild: [clientsGuard]
      },
      {
        path: 'suppliers',
        data: {
          breadcrumb: 'Suppliers'
        },
        loadChildren: () => import('./suppliers/suppliers.module').then(m => m.SuppliersModule),
        canActivateChild: [suppliersGuard]
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
export class PartnersRoutingModule { }

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PrincipalComponent } from './principal.component';

const routes: Routes = [
  {
    path: '',
    component: PrincipalComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        data: {
          breadcrumb: 'Dashboard',
          fullPath: '/p/dashboard'
        },
        loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'administration',
        data: {
          breadcrumb: 'Administration',
          fullPath: '/p/administration'
        },
        loadChildren: () => import('./administration/administration.module').then(m => m.AdministrationModule)
      },
      {
        path: 'masters',
        data: {
          breadcrumb: 'Masters',
          fullPath: '/p/masters'
        },
        loadChildren: () => import('./masters/masters.module').then(m => m.MastersModule)
      },
      {
        path: 'partners',
        data: {
          breadcrumb: 'Partners',
          fullPath: '/p/partners'
        },
        loadChildren: () => import('./partners/partners.module').then(m => m.PartnersModule)
      },
      {
        path: 'ip',
        data: {
          breadcrumb: 'INDUSTRIAL PURCHASES',
          fullPath: '/p/ip'
        },
        loadChildren: () => import('./ip/ip.module').then(m => m.IpModule)
      },
      {
        path: 'not-found',
        data: {
          breadcrumb: 'Not Found',
          fullPath: '/p/not-found'
        },
        loadChildren: () => import('./not-found/not-found.module').then(m => m.NotFoundModule)
      },
      { path: 'docs',
        data: {
          breadcrumb: 'Docs',
          fullPath: '/p/docs'
        },
        loadChildren: () => import('./docs/docs.module').then(m => m.DocsModule)
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
export class PrincipalRoutingModule { }

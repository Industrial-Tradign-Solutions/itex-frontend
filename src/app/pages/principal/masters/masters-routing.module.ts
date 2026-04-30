import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MastersComponent } from './masters.component';
import { brandsGuard, departmentsGuard, industriesGuard, locationsGuard } from '../../../guards/masters';

const routes: Routes = [
  {
    path: '',
    component: MastersComponent,
    children: [
      {
        path: 'departments',
        data: {
          breadcrumb: 'Departments'
        },
        loadChildren: () => import('./departments/departments.module').then(m => m.DepartmentsModule),
        canActivateChild: [ departmentsGuard ]
      },
      {
        path: 'locations',
        data: {
          breadcrumb: 'Locations'
        },
        loadChildren: () => import('./locations/locations.module').then(m => m.LocationsModule),
        canActivateChild: [ locationsGuard ]
      },
      {
        path: 'industries',
        data: {
          breadcrumb: 'Industries'
        },
        loadChildren: () => import('./industries/industries.module').then(m => m.IndustriesModule),
        canActivateChild: [industriesGuard]
      },
      {
        path: 'brands',
        data: {
          breadcrumb: 'Brands'
        },
        loadChildren: () => import('./brands/brands.module').then(m => m.BrandsModule),
        canActivateChild: [brandsGuard]
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
export class MastersRoutingModule { }

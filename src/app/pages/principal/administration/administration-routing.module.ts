import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdministrationComponent } from './administration.component';
import { rolesGuard, usersGuard } from '../../../guards/administration';

const routes: Routes = [
  {
    path: '',
    component: AdministrationComponent,
    children: [
      {
        path: 'users',
        data: {
          breadcrumb: 'Users'
        },
        loadChildren: () => import('./users/users.module').then(m => m.UsersModule),
        canActivateChild: [ usersGuard ]
      },
      {
        path: 'roles',
        data: {
          breadcrumb: 'Permissions'
        },
        loadChildren: () => import('./roles/roles.module').then(m => m.RolesModule),
        canActivateChild: [ rolesGuard ]
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
export class AdministrationRoutingModule { }

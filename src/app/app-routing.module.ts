import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authenticatedGuard, notAuthenticatedGuard } from '@guards/auth';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'p',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then(m => m.LoginModule),
    canActivate: [notAuthenticatedGuard]
  },
  {
    path: 'p',
    loadChildren: () => import('./pages/principal/principal.module').then(m => m.PrincipalModule),
    canActivate: [authenticatedGuard]
  },
  {
    path: '**',
    pathMatch: 'full',
    redirectTo: 'p'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

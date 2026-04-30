import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '@services/security';


export const notAuthenticatedGuard: CanActivateFn = (route, state) => {
  const authSV = inject(AuthService);
  return authSV.isNotAuthenticated();;
};

import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '@services/security';

export const authenticatedGuard: CanActivateFn = (route, state) => {
  const authSV = inject(AuthService);
  return authSV.isAuthenticated(state.url);
};

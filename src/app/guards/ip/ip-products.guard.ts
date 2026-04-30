import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { menuOptionsIds } from '../../../environments';
import { PermissionService } from '@services/security';

export const ipProductGuard: CanActivateFn = (route, state) => {
  const permissionsSV = inject(PermissionService);
  return permissionsSV.isValidMenu(menuOptionsIds.ip.products, state.url);
};

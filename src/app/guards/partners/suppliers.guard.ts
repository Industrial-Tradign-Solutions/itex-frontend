import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { PermissionService } from '@services/security';
import { menuOptionsIds } from '../../../environments';

export const suppliersGuard: CanActivateFn = (route, state) => {
  const permissionsSV = inject(PermissionService);
  return permissionsSV.isValidMenu(menuOptionsIds.partners.suppliers, state.url);
};

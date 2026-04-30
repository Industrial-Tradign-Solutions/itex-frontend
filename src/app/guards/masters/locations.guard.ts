import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { PermissionService } from '@services/security';
import { menuOptionsIds } from '../../../environments';

export const locationsGuard: CanActivateFn = (route, state) => {
  const permissionsSV = inject(PermissionService);
  return permissionsSV.isValidMenu(menuOptionsIds.masters.locations, state.url);
};

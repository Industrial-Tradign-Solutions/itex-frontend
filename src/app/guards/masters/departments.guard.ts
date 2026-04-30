import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { menuOptionsIds } from '../../../environments';
import { PermissionService } from '@services/security';

export const departmentsGuard: CanActivateFn = (route, state) => {
  const permissionsSV = inject(PermissionService);
  return permissionsSV.isValidMenu(menuOptionsIds.masters.departaments, state.url);
};

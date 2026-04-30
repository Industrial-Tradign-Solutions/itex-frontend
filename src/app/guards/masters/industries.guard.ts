import { inject } from '@angular/core';
import { CanActivateChildFn } from '@angular/router';
import { PermissionService } from '@services/security';
import { menuOptionsIds } from '../../../environments';

export const industriesGuard: CanActivateChildFn = (childRoute, state) => {
  const permissionsSV = inject(PermissionService);
  return permissionsSV.isValidMenu(menuOptionsIds.masters.industries, state.url);
};

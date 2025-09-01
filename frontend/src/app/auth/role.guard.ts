import { inject } from '@angular/core';
import { type CanActivateFn } from '@angular/router';

import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const roles = route.data?.['roles'] as string[] | undefined;
  if (!roles || roles.length === 0) {
    return true;
  }
  return roles.some((r) => auth.hasRole(r));
};

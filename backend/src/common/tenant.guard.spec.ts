import { type ExecutionContext } from '@nestjs/common';
import { type Reflector } from '@nestjs/core';

import { UserRole } from '../users/user.entity';
import { TenantGuard } from './tenant.guard';

describe('TenantGuard', () => {
  it('allows access to metrics endpoint without company ID', () => {
    const guard = new TenantGuard({
      getAllAndOverride: jest.fn(),
    } as unknown as Reflector);
    const context = {
      getClass: () => undefined,
      getHandler: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({ headers: {}, path: '/api/metrics' }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows master without company ID', () => {
    const guard = new TenantGuard({
      getAllAndOverride: jest.fn(),
    } as unknown as Reflector);
    const context = {
      getClass: () => undefined,
      getHandler: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({ headers: {}, user: { role: UserRole.Master } }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });
});

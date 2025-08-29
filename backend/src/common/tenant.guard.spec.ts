import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantGuard } from './tenant.guard';
import { UserRole } from '../users/user.entity';

describe('TenantGuard', () => {
  it('allows access to metrics endpoint without company ID', () => {
    const guard = new TenantGuard({
      getAllAndOverride: jest.fn(),
    } as unknown as Reflector);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ path: '/api/metrics', headers: {} }),
      }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows master without company ID', () => {
    const guard = new TenantGuard({
      getAllAndOverride: jest.fn(),
    } as unknown as Reflector);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: UserRole.Master }, headers: {} }),
      }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });
});

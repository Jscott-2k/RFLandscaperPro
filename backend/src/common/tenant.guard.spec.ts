import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantGuard } from './tenant.guard';

describe('TenantGuard', () => {
  it('allows access to metrics endpoint without company ID', () => {
    const guard = new TenantGuard(new Reflector());
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ path: '/api/metrics', headers: {} }),
      }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });
});

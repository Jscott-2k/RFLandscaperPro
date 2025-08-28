import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  it('allows access to metrics endpoint with global prefix', () => {
    const guard = new JwtAuthGuard(new Reflector());
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ path: '/api/metrics' }),
      }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });
});

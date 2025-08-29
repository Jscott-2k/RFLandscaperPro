import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/user.entity';
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

  it('throws ForbiddenException for mismatched company header', () => {
    const guard = new JwtAuthGuard(new Reflector());
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { 'x-company-id': '2' } }),
      }),
    } as unknown as ExecutionContext;

    expect(() =>
      guard.handleRequest(
        null,
        { id: 1, companyId: 1, role: UserRole.CompanyAdmin },
        null,
        context,
      ),
    ).toThrow(ForbiddenException);
  });
});

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { tenantStorage } from './tenant/tenant-context';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest<{
      user?: { companyId?: number };
      headers?: Record<string, string | string[]>;
    }>();
    const header = request.headers?.['x-company-id'];
    let companyId = request.user?.companyId;
    if (header) {
      const value = Array.isArray(header) ? header[0] : header;
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed)) {
        companyId = parsed;
        if (request.user) {
          request.user.companyId = parsed;
        }
      }
    }
    if (companyId !== undefined) {
      tenantStorage.enterWith({ companyId });
    }
    return Boolean(companyId);
  }
}

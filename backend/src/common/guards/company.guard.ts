import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class CompanyGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const req = context
      .switchToHttp()
      .getRequest<{ user?: { companyId?: number }; companyId?: number }>();
    if (!req.user || typeof req.user.companyId !== 'number') {
      return false;
    }
    req.companyId = req.user.companyId;
    return true;
  }
}

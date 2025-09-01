import {
  type ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { type Request } from 'express';

import { type RequestUser } from '../../auth/interfaces/request-user.interface';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { userStorage } from '../user/user-context';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const path = req.path || req.originalUrl || '';
    if (path.startsWith('/api/metrics') || path.startsWith('/metrics')) {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest<TUser extends RequestUser = RequestUser>(
    err: unknown,
    user: TUser,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      if (err instanceof Error) {
        throw err;
      }
      throw new UnauthorizedException();
    }
    userStorage.enterWith({ userId: user.id });
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers['x-company-id'];
    if (header) {
      const parsed = parseInt(header as string, 10);
      if (!isNaN(parsed) && user.companyId !== parsed) {
        throw new ForbiddenException('Invalid company access');
      }
    }
    return user;
  }
}

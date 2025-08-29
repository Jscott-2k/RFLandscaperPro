import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../users/user.entity';

export const AuthUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<{ user?: any }>();
    const user = request.user;
    if (!user) {
      return undefined as unknown as User;
    }
    return Object.assign(new User(), {
      id: user.userId,
      username: user.username,
      role: user.role,
      companyId: user.companyId,
    });
  },
);

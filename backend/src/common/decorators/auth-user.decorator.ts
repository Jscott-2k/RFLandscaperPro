import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import { User } from '../../users/user.entity';

type RequestUser = {
  companyId: number;
  role: User['role'];
  userId: number;
  username: string;
}

export const AuthUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: RequestUser }>();
    const { user } = request;
    if (!user) {
      return undefined;
    }
    return Object.assign(new User(), {
      companyId: user.companyId,
      id: user.userId,
      role: user.role,
      username: user.username,
    });
  },
);

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../users/user.entity';

interface RequestUser {
  userId: number;
  username: string;
  role: User['role'];
  companyId: number;
}

export const AuthUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: RequestUser }>();
    const { user } = request;
    if (!user) {
      return undefined;
    }
    return Object.assign(new User(), {
      id: user.userId,
      username: user.username,
      role: user.role,
      companyId: user.companyId,
    });
  },
);

import 'reflect-metadata';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { ExecutionContext } from '@nestjs/common';
import { AuthUser } from './auth-user.decorator';
import { User } from '../../users/user.entity';

describe('AuthUser Decorator', () => {
  it('should return the user from the request', () => {
    class TestController {
      test(@AuthUser() user: User | undefined) {
        return user;
      }
    }
    const metadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      TestController,
      'test',
    ) as Record<
      string,
      { factory: (data: unknown, ctx: ExecutionContext) => User | undefined }
    >;
    const key = Object.keys(metadata)[0];
    const { factory } = metadata[key];

    const mockUser = {
      userId: 1,
      username: 'test',
      role: 'customer' as User['role'],
      companyId: 2,
    };

    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ user: mockUser }),
      }),
    } as unknown as ExecutionContext;

    const result = factory(undefined, ctx);
    expect(result).toEqual(
      expect.objectContaining({
        id: 1,
        username: 'test',
        role: 'customer',
        companyId: 2,
      }),
    );
  });
});

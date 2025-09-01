import { type ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

import { type User } from '../../users/user.entity';
import { AuthUser } from './auth-user.decorator';

import 'reflect-metadata';

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
      companyId: 2,
      role: 'customer' as User['role'],
      userId: 1,
      username: 'test',
    };

    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ user: mockUser }),
      }),
    } as unknown as ExecutionContext;

    const result = factory(undefined, ctx);
    expect(result).toEqual(
      expect.objectContaining({
        companyId: 2,
        id: 1,
        role: 'customer',
        username: 'test',
      }),
    );
  });
});

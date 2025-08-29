import "reflect-metadata";
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { AuthUser } from './auth-user.decorator';
import { User } from '../../users/user.entity';

describe('AuthUser Decorator', () => {
  it('should return the user from the request', () => {
    class TestController {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      test(@AuthUser() _user: User) {}
    }
    const metadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      TestController,
      'test',
    );
    const key = Object.keys(metadata)[0];
    const { factory } = metadata[key];

    const mockUser = {
      userId: 1,
      username: 'test',
      role: 'customer',
      companyId: 2,
    };

    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ user: mockUser }),
      }),
    } as any;

    const result = factory(null, ctx);
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

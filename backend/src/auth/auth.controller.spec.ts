import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User, UserRole } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    validateUser: jest.Mock;
    login: jest.Mock;
    register: jest.Mock;
    requestPasswordReset: jest.Mock;
    resetPassword: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      validateUser: jest.fn(),
      login: jest.fn(),
      register: jest.fn(),
      requestPasswordReset: jest.fn(),
      resetPassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('registers a new user without returning password', async () => {
    const dto: RegisterDto = { username: 'user', password: 'pass' };
    const user: User = {
      id: 1,
      username: 'user',
      password: 'hashed',
      role: UserRole.Customer,
      passwordResetToken: null,
      passwordResetExpires: null,
    } as User;
    authService.register.mockResolvedValue(user);

    const result = await controller.register(dto);

    expect(authService.register).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 1, username: 'user', role: UserRole.Customer });
  });

  it('requests password reset', async () => {
    const dto: RequestPasswordResetDto = { username: 'user' };
    await controller.requestPasswordReset(dto);
    expect(authService.requestPasswordReset).toHaveBeenCalledWith('user');
  });

  it('resets password', async () => {
    const dto: ResetPasswordDto = { token: 'abc', password: 'new' };
    await controller.resetPassword(dto);
    expect(authService.resetPassword).toHaveBeenCalledWith('abc', 'new');
  });
});

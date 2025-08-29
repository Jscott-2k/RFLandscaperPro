import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    validateUser: jest.Mock;
    login: jest.Mock;
    register: jest.Mock;
    verifyEmail: jest.Mock;
    requestPasswordReset: jest.Mock;
    resetPassword: jest.Mock;
    refresh: jest.Mock;
    logout: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      validateUser: jest.fn(),
      login: jest.fn(),
      register: jest.fn(),
      verifyEmail: jest.fn(),
      requestPasswordReset: jest.fn(),
      resetPassword: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('registers a new user and sends verification email', async () => {
    const dto: RegisterDto = {
      username: 'user',
      email: 'user@example.com',
      password: 'pass',
    };
    const response = { message: 'Verification email sent' };
    authService.register.mockResolvedValue(response);

    const result = await controller.register(dto);

    expect(authService.register).toHaveBeenCalledWith(dto);
    expect(result).toEqual(response);
  });

  it('verifies email', async () => {
    await controller.verifyEmail({ token: 'abc' });
    expect(authService.verifyEmail).toHaveBeenCalledWith('abc');
  });

  it('requests password reset', async () => {
    const dto: RequestPasswordResetDto = { email: 'user@example.com' };
    await controller.requestPasswordReset(dto);
    expect(authService.requestPasswordReset).toHaveBeenCalledWith(
      'user@example.com',
    );
  });

  it('resets password', async () => {
    const dto: ResetPasswordDto = { token: 'abc', password: 'new' };
    await controller.resetPassword(dto);
    expect(authService.resetPassword).toHaveBeenCalledWith('abc', 'new');
  });

  it('refreshes token', async () => {
    authService.refresh.mockResolvedValue({
      access_token: 'newAccess',
      refresh_token: 'newRefresh',
    });
    const result = await controller.refresh({ refreshToken: 'token' });
    expect(authService.refresh).toHaveBeenCalledWith('token');
    expect(result).toEqual({
      access_token: 'newAccess',
      refresh_token: 'newRefresh',
    });
  });

  it('logs out', async () => {
    await controller.logout({ refreshToken: 'token' });
    expect(authService.logout).toHaveBeenCalledWith('token');
  });
});

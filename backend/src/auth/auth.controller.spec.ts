import { Test, type TestingModule } from '@nestjs/testing';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { type LoginDto } from './dto/login.dto';
import { type RegisterDto } from './dto/register.dto';
import { type RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { type ResetPasswordDto } from './dto/reset-password.dto';
import { type SignupOwnerDto } from './dto/signup-owner.dto';

import 'reflect-metadata';

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
    signupOwner: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
      logout: jest.fn(),
      refresh: jest.fn(),
      register: jest.fn(),
      requestPasswordReset: jest.fn(),
      resetPassword: jest.fn(),
      signupOwner: jest.fn(),
      validateUser: jest.fn(),
      verifyEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('logs in without company', async () => {
    const dto: LoginDto = { email: 'user@example.com', password: 'pass' };
    const user: { id: number } = { id: 1 };
    const resultPayload: { access_token: string } = { access_token: 'token' };
    authService.validateUser.mockResolvedValue(user);
    authService.login.mockResolvedValue(resultPayload);

    const result = await controller.login(dto);

    expect(authService.validateUser).toHaveBeenCalledWith(
      'user@example.com',
      'pass',
    );
    expect(authService.login).toHaveBeenCalledWith(user);
    expect(result).toEqual(resultPayload);
  });

  it('signs up a new owner', async () => {
    const dto: SignupOwnerDto = {
      companyName: 'Acme Co',
      email: 'owner@example.com',
      firstName: 'Owner',
      lastName: 'User',
      password: 'Password1!',
      phone: '5551234567',
    };
    const response: { access_token: string } = { access_token: 'jwt' };
    authService.signupOwner.mockResolvedValue(response);

    const result = await controller.signupOwner(dto);

    expect(authService.signupOwner).toHaveBeenCalledWith(dto);
    expect(result).toEqual(response);
  });

  it('registers a new user and sends verification email', async () => {
    const dto: RegisterDto = {
      email: 'user@example.com',
      password: 'pass',
      username: 'user',
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
    const dto: ResetPasswordDto = { password: 'new', token: 'abc' };
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

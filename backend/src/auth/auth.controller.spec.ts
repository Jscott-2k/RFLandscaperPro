import { Test, type TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { type Request, type Response } from 'express';

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
  let configService: { get: jest.Mock };

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
    configService = { get: jest.fn().mockReturnValue('7d') };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('logs in and sets cookie with correct attributes in non-production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const dto: LoginDto = { email: 'user@example.com', password: 'pass' };
    const user: { id: number } = { id: 1 };
    authService.validateUser.mockResolvedValue(user);
    authService.login.mockResolvedValue({
      access_token: 'token',
      refresh_token: 'rt',
    });
    const res = { cookie: jest.fn() } as unknown as Response;

    const result = await controller.login(dto, res);

    expect(authService.validateUser).toHaveBeenCalledWith(
      'user@example.com',
      'pass',
    );
    expect(authService.login).toHaveBeenCalledWith(user);
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'rt',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
        secure: false,
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }),
    );
    expect(result).toEqual({ access_token: 'token' });
    process.env.NODE_ENV = originalEnv;
  });

  it('uses secure cookies in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const dto: LoginDto = { email: 'user@example.com', password: 'pass' };
    const user: { id: number } = { id: 1 };
    authService.validateUser.mockResolvedValue(user);
    authService.login.mockResolvedValue({
      access_token: 'token',
      refresh_token: 'rt',
    });
    const res = { cookie: jest.fn() } as unknown as Response;

    await controller.login(dto, res);

    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'rt',
      expect.objectContaining({ secure: true }),
    );
    process.env.NODE_ENV = originalEnv;
  });

  it('signs up a new owner', async () => {
    const dto: SignupOwnerDto = {
      companyName: 'Acme Co',
      email: 'owner@example.com',
      firstName: 'Owner',
      lastName: 'User',
      username: 'owner',
      password: 'Password1!',
      phone: '5551234567',
    };
    authService.signupOwner.mockResolvedValue({
      access_token: 'jwt',
      refresh_token: 'ref',
    });
    const res = { cookie: jest.fn() } as unknown as Response;

    const result = await controller.signupOwner(dto, res);

    expect(authService.signupOwner).toHaveBeenCalledWith(dto);
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'ref',
      expect.any(Object),
    );
    expect(result).toEqual({ access_token: 'jwt' });
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
    const req = {
      headers: { cookie: 'refreshToken=token' },
    } as unknown as Request;
    const res = { cookie: jest.fn() } as unknown as Response;
    const result = await controller.refresh(req, res);
    expect(authService.refresh).toHaveBeenCalledWith('token');
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'newRefresh',
      expect.any(Object),
    );
    expect(result).toEqual({ access_token: 'newAccess' });
  });

  it('logs out', async () => {
    const req = {
      headers: { cookie: 'refreshToken=token' },
    } as unknown as Request;
    const res = { clearCookie: jest.fn() } as unknown as Response;
    await controller.logout(req, res);
    expect(authService.logout).toHaveBeenCalledWith('token');
    expect(res.clearCookie).toHaveBeenCalledWith(
      'refreshToken',
      expect.any(Object),
    );
  });
});

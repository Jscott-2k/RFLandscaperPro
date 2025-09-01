import { UnauthorizedException } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { type JwtService } from '@nestjs/jwt';
import { type Repository } from 'typeorm';

import { type EmailService } from '../common/email';
import {
  CompanyUser,
  CompanyUserRole,
  CompanyUserStatus,
} from '../companies/entities/company-user.entity';
import { type UserCreationService } from '../users/user-creation.service';
import { User, UserRole } from '../users/user.entity';
import { type UsersService } from '../users/users.service';
import { Email } from '../users/value-objects/email.vo';
import { AuthService } from './auth.service';
import { type JwtUserPayload } from './interfaces/jwt-user-payload.interface';
import { type CompanyMembershipRepository } from './repositories/company-membership.repository';
import { type RefreshTokenRepository } from './repositories/refresh-token.repository';
import { type VerificationTokenRepository } from './repositories/verification-token.repository';

describe('AuthService.switchCompany', () => {
  let service: AuthService;
  let repo: jest.Mocked<CompanyMembershipRepository>;
  let jwt: { signAsync: jest.Mock };
  let userCreationService: jest.Mocked<Pick<UserCreationService, 'createUser'>>;

  beforeEach(() => {
    repo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<CompanyMembershipRepository>;
    jwt = { signAsync: jest.fn() };
    userCreationService = {
      createUser: jest.fn(),
    } as jest.Mocked<Pick<UserCreationService, 'createUser'>>;
    service = new AuthService(
      {} as unknown as UsersService,
      userCreationService as unknown as UserCreationService,
      jwt as unknown as JwtService,
      {} as ConfigService,
      {} as RefreshTokenRepository,
      {} as VerificationTokenRepository,
      {} as unknown as Repository<User>,
      {} as EmailService,
      repo as CompanyMembershipRepository,
    );
  });

  it('throws when membership is missing', async () => {
    repo.findOne.mockResolvedValue(null);

    const user: JwtUserPayload = {
      email: 'a@e.com',
      userId: 1,
      username: 'a',
    };
    await expect(service.switchCompany(user, 2)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('returns token for valid membership', async () => {
    repo.findOne.mockResolvedValue(
      Object.assign(new CompanyUser(), {
        companyId: 2,
        role: CompanyUserRole.ADMIN,
        status: CompanyUserStatus.ACTIVE,
        userId: 1,
      }),
    );
    jwt.signAsync.mockResolvedValue('jwt');

    const user: JwtUserPayload = {
      email: 'a@e.com',
      userId: 1,
      username: 'a',
    };
    const result = await service.switchCompany(user, 2);

    expect(jwt.signAsync).toHaveBeenCalledWith({
      companyId: 2,
      email: 'a@e.com',
      role: UserRole.CompanyAdmin,
      roles: [UserRole.CompanyAdmin],
      sub: 1,
      username: 'a',
    });
    expect(result).toEqual({ access_token: 'jwt' });
  });
});

describe('AuthService.signupOwner', () => {
  let service: AuthService;
  let userCreationService: jest.Mocked<Pick<UserCreationService, 'createUser'>>;
  let loginSpy: jest.SpyInstance;

  beforeEach(() => {
    userCreationService = {
      createUser: jest.fn(),
    } as jest.Mocked<Pick<UserCreationService, 'createUser'>>;
    service = new AuthService(
      {} as unknown as UsersService,
      userCreationService as unknown as UserCreationService,
      { signAsync: jest.fn() } as unknown as JwtService,
      {} as ConfigService,
      {} as RefreshTokenRepository,
      {} as VerificationTokenRepository,
      {} as unknown as Repository<User>,
      {} as EmailService,
      { findOne: jest.fn() } as unknown as CompanyMembershipRepository,
    );
    loginSpy = jest.spyOn(service, 'login').mockResolvedValue({
      access_token: '',
      refresh_token: '',
      user: {
        email: '',
        id: 0,
        role: UserRole.CompanyOwner,
        roles: [UserRole.CompanyOwner],
        username: '',
      },
    });
  });

  it('delegates to UserCreationService.createUser', async () => {
    const user = Object.assign(new User(), {
      email: 'owner@example.com',
      id: 1,
      role: UserRole.CompanyOwner,
      username: 'owner',
    });
    userCreationService.createUser.mockResolvedValue(user);

    await service.signupOwner({
      companyName: 'ACME',
      email: 'owner@example.com',
      name: 'owner',
      password: 'Password123!',
    });

    expect(userCreationService.createUser).toHaveBeenCalledWith({
      company: { name: 'ACME' },
      email: new Email('owner@example.com'),
      isVerified: true,
      password: 'Password123!',
      role: UserRole.CompanyOwner,
      username: 'owner',
    });
    expect(loginSpy).toHaveBeenCalledWith(user);
  });
});

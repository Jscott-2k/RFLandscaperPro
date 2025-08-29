import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../users/user.entity';
import {
  CompanyUser,
  CompanyUserRole,
  CompanyUserStatus,
} from '../companies/entities/company-user.entity';
import { EmailService } from '../common/email.service';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { VerificationTokenRepository } from './repositories/verification-token.repository';
import { CompanyMembershipRepository } from './repositories/company-membership.repository';
import { UserCreationService } from '../users/user-creation.service';

describe('AuthService.switchCompany', () => {
  let service: AuthService;
  let repo: jest.Mocked<CompanyMembershipRepository>;
  let jwt: { signAsync: jest.Mock };
  let userCreationService: jest.Mocked<Pick<UserCreationService, 'createUser'>>;

  beforeEach(() => {
    repo = { findOne: jest.fn() } as any;
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
      {} as unknown as any, // Repository<User>
      {} as EmailService,
      repo as CompanyMembershipRepository,
    );
  });

  it('throws when membership is missing', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(
      service.switchCompany({ userId: 1, username: 'a', email: 'a@e.com' }, 2),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns token for valid membership', async () => {
    repo.findOne.mockResolvedValue(
      Object.assign(new CompanyUser(), {
        userId: 1,
        companyId: 2,
        role: CompanyUserRole.ADMIN,
        status: CompanyUserStatus.ACTIVE,
      }),
    );
    jwt.signAsync.mockResolvedValue('jwt');

    const result = await service.switchCompany(
      { userId: 1, username: 'a', email: 'a@e.com' },
      2,
    );

    expect(jwt.signAsync).toHaveBeenCalledWith({
      username: 'a',
      sub: 1,
      email: 'a@e.com',
      companyId: 2,
      roles: [UserRole.Admin],
      role: UserRole.Admin,
    });
    expect(result).toEqual({ access_token: 'jwt' });
  });
});

describe('AuthService.signupOwner', () => {
  let service: AuthService;
  let userCreationService: jest.Mocked<Pick<UserCreationService, 'createUser'>>;

  beforeEach(() => {
    userCreationService = {
      createUser: jest.fn(),
    } as jest.Mocked<Pick<UserCreationService, 'createUser'>>;
    service = new AuthService(
      {} as unknown as UsersService,
      userCreationService as unknown as UserCreationService,
      { signAsync: jest.fn() } as unknown as JwtService,
      {} as ConfigService,
      {} as unknown as Repository<RefreshToken>,
      {} as unknown as Repository<VerificationToken>,
      {} as EmailService,
      { findOne: jest.fn() } as unknown as Repository<CompanyUser>,
    );
    jest.spyOn(service, 'login').mockResolvedValue({} as any);
  });

  it('delegates to UserCreationService.createUser', async () => {
    const user = Object.assign(new User(), {
      id: 1,
      username: 'owner',
      email: 'owner@example.com',
      role: UserRole.Owner,
    });
    userCreationService.createUser.mockResolvedValue(user);

    await service.signupOwner({
      name: 'owner',
      email: 'owner@example.com',
      password: 'Password123!',
      companyName: 'ACME',
    });

    expect(userCreationService.createUser).toHaveBeenCalledWith({
      username: 'owner',
      email: 'owner@example.com',
      password: 'Password123!',
      role: UserRole.Owner,
      company: { name: 'ACME' },
      isVerified: true,
    });
    expect(service.login).toHaveBeenCalledWith(user);
  });
});

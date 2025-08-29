import { UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshToken } from './refresh-token.entity';
import { VerificationToken } from './verification-token.entity';
import { User, UserRole } from '../users/user.entity';
import {
  CompanyUser,
  CompanyUserRole,
  CompanyUserStatus,
} from '../companies/entities/company-user.entity';
import { EmailService } from '../common/email.service';
import { JwtUserPayload } from './interfaces/jwt-user-payload.interface';

describe('AuthService.switchCompany', () => {
  let service: AuthService;
  let repo: jest.Mocked<Pick<Repository<CompanyUser>, 'findOne'>>;
  let jwt: { signAsync: jest.Mock };

  beforeEach(() => {
    repo = { findOne: jest.fn() } as any;
    jwt = { signAsync: jest.fn() };
    service = new AuthService(
      {} as unknown as UsersService,
      jwt as unknown as JwtService,
      {} as ConfigService,
      {} as unknown as Repository<RefreshToken>,
      {} as unknown as Repository<VerificationToken>,
      {} as unknown as Repository<User>,
      {} as EmailService,
      repo as unknown as Repository<CompanyUser>,
    );
  });

  it('throws when membership is missing', async () => {
    repo.findOne.mockResolvedValue(null);
    const user: JwtUserPayload = {
      userId: 1,
      username: 'a',
      email: 'a@e.com',
    };
    await expect(service.switchCompany(user, 2)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
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

    const user: JwtUserPayload = {
      userId: 1,
      username: 'a',
      email: 'a@e.com',
    };
    const result = await service.switchCompany(user, 2);

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

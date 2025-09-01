import {
  Injectable,
  UnauthorizedException,
  Inject,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'node:crypto';
import { Repository } from 'typeorm';

import { EmailService } from '../common/email';
import { verificationMail } from '../common/email/templates';
import {
  CompanyUserRole,
  CompanyUserStatus,
} from '../companies/entities/company-user.entity';
import { MetricsService } from '../metrics/metrics.service';
import { UserCreationService } from '../users/user-creation.service';
import { User, UserRole } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { Email } from '../users/value-objects/email.vo';
import { PhoneNumber } from '../users/value-objects/phone-number.vo';
import { type RegisterDto } from './dto/register.dto';
import { type SignupOwnerDto } from './dto/signup-owner.dto';
import { type JwtUserPayload } from './interfaces/jwt-user-payload.interface';
import { validatePasswordStrength } from './password.util';
import {
  type CompanyMembershipRepository,
  COMPANY_MEMBERSHIP_REPOSITORY,
} from './repositories/company-membership.repository';
import {
  type RefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from './repositories/refresh-token.repository';
import {
  type VerificationTokenRepository,
  VERIFICATION_TOKEN_REPOSITORY,
} from './repositories/verification-token.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly userCreationService: UserCreationService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @Inject(VERIFICATION_TOKEN_REPOSITORY)
    private readonly verificationTokenRepository: VerificationTokenRepository,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    private readonly emailService: EmailService,
    @Inject(COMPANY_MEMBERSHIP_REPOSITORY)
    private readonly companyMembershipRepository: CompanyMembershipRepository,
    @Optional() private readonly metrics?: MetricsService,
  ) {}

  async validateUser(email: string, pass: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.metrics?.incrementCounter('login_failures_total', {
        route: 'auth.login',
        status: 'user_not_found',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await user.validatePassword(pass);
    if (!isValidPassword) {
      this.metrics?.incrementCounter('login_failures_total', {
        companyId: user.companyId ?? undefined,
        route: 'auth.login',
        status: 'invalid_password',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      this.metrics?.incrementCounter('login_failures_total', {
        companyId: user.companyId ?? undefined,
        route: 'auth.login',
        status: 'email_not_verified',
      });
      throw new UnauthorizedException('Email not verified');
    }

    return user;
  }

  async login(user: User) {
    const roles = [user.role];
    const payload = {
      companyId: null as number | null,
      email: user.email,
      role: user.role,
      roles,
      sub: user.id,
      username: user.username,
    };

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });
    await this.saveRefreshToken(user.id, refreshToken);

    return {
      access_token: await this.jwtService.signAsync(payload),
      refresh_token: refreshToken,
      user: {
        email: user.email.value,
        id: user.id,
        role: user.role,
        roles,
        username: user.username,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    // Validate password strength
    validatePasswordStrength(registerDto.password);

    const { email, phone, ...rest } = registerDto;
    const user = await this.usersService.create({
      ...rest,
      company: registerDto.company,
      email: new Email(email),
      phone: phone ? new PhoneNumber(phone) : undefined,
    });

    const token = await this.createVerificationToken(user.id);
    await this.emailService.send(verificationMail(user.email.value, token));
    return { message: 'Verification email sent' };
  }

  async signupOwner(dto: SignupOwnerDto) {
    validatePasswordStrength(dto.password);

    const user = await this.userCreationService.createUser({
      company: { name: dto.companyName },
      email: new Email(dto.email),
      isVerified: true,
      password: dto.password,
      role: UserRole.CompanyOwner,
      username: dto.name,
    });

    return this.login(user);
  }

  async switchCompany(
    user: JwtUserPayload,
    companyId: number,
  ): Promise<{ access_token: string }> {
    // Allow master users to switch companies without membership lookup
    if (user.role === UserRole.Master) {
      const payload = {
        companyId,
        email: user.email,
        role: UserRole.Master,
        roles: [UserRole.Master],
        sub: user.userId,
        username: user.username,
      };

      return {
        access_token: await this.jwtService.signAsync(payload),
      };
    }

    const membership = await this.companyMembershipRepository.findOne({
      where: {
        companyId,
        status: CompanyUserStatus.ACTIVE,
        userId: user.userId,
      },
    });
    if (!membership) {
      throw new UnauthorizedException('Invalid company');
    }

    const role = this.mapRole(membership.role);
    const payload = {
      companyId,
      email: user.email,
      role,
      roles: [role],
      sub: user.userId,
      username: user.username,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  private mapRole(role: CompanyUserRole): UserRole {
    switch (role) {
      case CompanyUserRole.OWNER:
        return UserRole.CompanyOwner;
      case CompanyUserRole.ADMIN:
        return UserRole.CompanyAdmin;
      default:
        return UserRole.Worker;
    }
  }

  async verifyEmail(token: string): Promise<void> {
    const hashed = this.hashToken(token);
    const record = await this.verificationTokenRepository.findOne({
      where: { token: hashed },
    });
    if (!record || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    await this.usersService.markEmailVerified(record.userId);
    await this.verificationTokenRepository.delete({ userId: record.userId });
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.usersService.requestPasswordReset(email);
  }

  async resetPassword(token: string, password: string): Promise<void> {
    // Validate new password strength
    validatePasswordStrength(password);

    const user = await this.usersService.resetPassword(token, password);
    await this.refreshTokenRepository.update(
      { userId: user.id },
      {
        isRevoked: true,
      },
    );
  }

  async refresh(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{
        username: string;
        sub: number;
        email: string;
        roles?: UserRole[];
        role?: UserRole;
        companyId: number | null;
      }>(token);
      const hashed = this.hashToken(token);
      const tokenEntity = await this.refreshTokenRepository.findOne({
        where: { isRevoked: false, token: hashed, userId: payload.sub },
      });
      if (!tokenEntity || tokenEntity.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      tokenEntity.isRevoked = true;
      await this.refreshTokenRepository.save(tokenEntity);
      const newRefresh = await this.jwtService.signAsync(
        {
          companyId: payload.companyId,
          email: payload.email,
          role: payload.role ?? payload.roles?.[0],
          roles: payload.roles ?? (payload.role ? [payload.role] : []),
          sub: payload.sub,
          username: payload.username,
        },
        {
          expiresIn: this.configService.get<string>(
            'JWT_REFRESH_EXPIRES_IN',
            '7d',
          ),
        },
      );
      await this.saveRefreshToken(payload.sub, newRefresh);
      return {
        access_token: await this.jwtService.signAsync({
          companyId: payload.companyId,
          email: payload.email,
          role: payload.role ?? payload.roles?.[0],
          roles: payload.roles ?? (payload.role ? [payload.role] : []),
          sub: payload.sub,
          username: payload.username,
        }),
        refresh_token: newRefresh,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(token: string): Promise<void> {
    const hashed = this.hashToken(token);
    await this.refreshTokenRepository.update(
      { token: hashed },
      {
        isRevoked: true,
      },
    );
  }

  private async createVerificationToken(userId: number): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const hashed = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const entity = this.verificationTokenRepository.create({
      expiresAt,
      token: hashed,
      userId,
    });
    await this.verificationTokenRepository.save(entity);
    return token;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async saveRefreshToken(userId: number, token: string): Promise<void> {
    const hashed = this.hashToken(token);
    const decoded: unknown = this.jwtService.decode(token);
    const expiresAt =
      typeof decoded === 'object' && decoded !== null && 'exp' in decoded
        ? new Date((decoded as { exp: number }).exp * 1000)
        : new Date();
    const entity = this.refreshTokenRepository.create({
      expiresAt,
      token: hashed,
      userId,
    });
    await this.refreshTokenRepository.save(entity);
  }
}

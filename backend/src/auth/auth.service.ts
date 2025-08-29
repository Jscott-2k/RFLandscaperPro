import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/user.entity';
import { Email } from '../users/value-objects/email.vo';
import { PhoneNumber } from '../users/value-objects/phone-number.vo';
import { UserCreationService } from '../users/user-creation.service';
import { RegisterDto } from './dto/register.dto';
import { SignupOwnerDto } from './dto/signup-owner.dto';
import { validatePasswordStrength } from './password.util';
import { EmailService } from '../common/email';
import { verificationMail } from '../common/email/templates';
import {
  CompanyUserRole,
  CompanyUserStatus,
} from '../companies/entities/company-user.entity';
import { JwtUserPayload } from './interfaces/jwt-user-payload.interface';
import {
  RefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from './repositories/refresh-token.repository';
import {
  VerificationTokenRepository,
  VERIFICATION_TOKEN_REPOSITORY,
} from './repositories/verification-token.repository';
import {
  CompanyMembershipRepository,
  COMPANY_MEMBERSHIP_REPOSITORY,
} from './repositories/company-membership.repository';

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
  ) {}

  async validateUser(email: string, pass: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await user.validatePassword(pass);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Email not verified');
    }

    return user;
  }

  async login(user: User) {
    const payload = {
      username: user.username,
      sub: user.id,
      email: user.email,
      companyId: null as number | null,
      roles: [user.role],
      role: user.role,
    };

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });
    await this.saveRefreshToken(user.id, refreshToken);

    return {
      access_token: await this.jwtService.signAsync(payload),
      refresh_token: refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email.value,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    // Validate password strength
    validatePasswordStrength(registerDto.password);

    const { email, phone, ...rest } = registerDto;
    const user = await this.usersService.create({
      ...rest,
      email: new Email(email),
      phone: phone ? new PhoneNumber(phone) : undefined,
      company: registerDto.company,
    });

    const token = await this.createVerificationToken(user.id);
    await this.emailService.send(verificationMail(user.email.value, token));
    return { message: 'Verification email sent' };
  }

  async signupOwner(dto: SignupOwnerDto) {
    validatePasswordStrength(dto.password);

    const user = await this.userCreationService.createUser({
      username: dto.name,
      email: new Email(dto.email),
      password: dto.password,
      role: UserRole.Owner,
      company: { name: dto.companyName },
      isVerified: true,
    });

    return this.login(user);
  }

  async switchCompany(
    user: JwtUserPayload,
    companyId: number,
  ): Promise<{ access_token: string }> {
    const membership = await this.companyMembershipRepository.findOne({
      where: {
        companyId,
        userId: user.userId,
        status: CompanyUserStatus.ACTIVE,
      },
    });
    if (!membership) {
      throw new UnauthorizedException('Invalid company');
    }

    const role = this.mapRole(membership.role);
    const payload = {
      username: user.username,
      sub: user.userId,
      email: user.email,
      companyId,
      roles: [role],
      role,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  private mapRole(role: CompanyUserRole): UserRole {
    switch (role) {
      case CompanyUserRole.OWNER:
        return UserRole.Owner;
      case CompanyUserRole.ADMIN:
        return UserRole.Admin;
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
        where: { token: hashed, userId: payload.sub, isRevoked: false },
      });
      if (!tokenEntity || tokenEntity.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      tokenEntity.isRevoked = true;
      await this.refreshTokenRepository.save(tokenEntity);
      const newRefresh = await this.jwtService.signAsync(
        {
          username: payload.username,
          sub: payload.sub,
          email: payload.email,
          companyId: payload.companyId,
          roles: payload.roles ?? (payload.role ? [payload.role] : []),
          role: payload.role ?? payload.roles?.[0],
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
          username: payload.username,
          sub: payload.sub,
          email: payload.email,
          companyId: payload.companyId,
          roles: payload.roles ?? (payload.role ? [payload.role] : []),
          role: payload.role ?? payload.roles?.[0],
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
      token: hashed,
      userId,
      expiresAt,
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
      token: hashed,
      userId,
      expiresAt,
    });
    await this.refreshTokenRepository.save(entity);
  }
}

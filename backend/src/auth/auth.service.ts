import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { SignupOwnerDto } from './dto/signup-owner.dto';
import { validatePasswordStrength } from './password.util';
import { RefreshToken } from './refresh-token.entity';
import { VerificationToken } from './verification-token.entity';
import { EmailService } from '../common/email.service';
import { Company } from '../companies/entities/company.entity';
import {
  CompanyUser,
  CompanyUserRole,
  CompanyUserStatus,
} from '../companies/entities/company-user.entity';
import { JwtUserPayload } from './interfaces/jwt-user-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(VerificationToken)
    private readonly verificationTokenRepository: Repository<VerificationToken>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly emailService: EmailService,
    @InjectRepository(CompanyUser)
    private readonly companyUsersRepository: Repository<CompanyUser>,
  ) {}

  async validateUser(email: string, pass: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { email } });
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
        email: user.email,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    // Validate password strength
    validatePasswordStrength(registerDto.password);

    const user = await this.usersService.create({
      ...registerDto,
      company: registerDto.company,
    });

    const token = await this.createVerificationToken(user.id);
    await this.emailService.sendVerificationEmail(user.email, token);

    return { message: 'Verification email sent' };
  }

  async signupOwner(dto: SignupOwnerDto) {
    validatePasswordStrength(dto.password);

    const existing = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    try {
      const user = await this.usersRepository.manager.transaction(
        async (manager) => {
          const userRepo = manager.getRepository(User);
          const companyRepo = manager.getRepository(Company);
          const membershipRepo = manager.getRepository(CompanyUser);

          const newUser = userRepo.create({
            username: dto.name,
            email: dto.email,
            password: dto.password,
            role: UserRole.Owner,
            isVerified: true,
          });
          const savedUser = await userRepo.save(newUser);

          const company = companyRepo.create({
            name: dto.companyName,
            ownerId: savedUser.id,
          });
          const savedCompany = await companyRepo.save(company);

          savedUser.companyId = savedCompany.id;
          await userRepo.save(savedUser);

          const membership = membershipRepo.create({
            companyId: savedCompany.id,
            userId: savedUser.id,
            role: CompanyUserRole.OWNER,
          });
          await membershipRepo.save(membership);

          return savedUser;
        },
      );

      return this.login(user);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const { code } = error.driverError as { code?: string };
        if (code === '23505') {
          throw new ConflictException('Email already exists');
        }
      }
      throw error;
    }
  }

  async switchCompany(
    user: JwtUserPayload,
    companyId: number,
  ): Promise<{ access_token: string }> {
    const membership = await this.companyUsersRepository.findOne({
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
    await this.usersRepository.update(record.userId, { isVerified: true });
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

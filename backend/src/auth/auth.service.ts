import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { validatePasswordStrength } from './password.util';
import { RefreshToken } from './refresh-token.entity';
import { VerificationToken } from './verification-token.entity';
import { EmailService } from '../common/email.service';

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
      role: user.role,
      companyId: user.companyId,
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
        role: UserRole;
        companyId: number;
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
          role: payload.role,
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
          role: payload.role,
          companyId: payload.companyId,
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

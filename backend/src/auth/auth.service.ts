import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { validatePasswordStrength } from './password.util';
import { RefreshToken } from './refresh-token.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async validateUser(username: string, pass: string): Promise<User> {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await user.validatePassword(pass);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
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
      expiresIn: '7d',
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

  async register(registerDto: RegisterDto): Promise<User> {
    // Validate password strength
    validatePasswordStrength(registerDto.password);

    return this.usersService.create(registerDto);
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
        { expiresIn: '7d' },
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

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async saveRefreshToken(userId: number, token: string): Promise<void> {
    const hashed = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const entity = this.refreshTokenRepository.create({
      token: hashed,
      userId,
      expiresAt,
    });
    await this.refreshTokenRepository.save(entity);
  }
}

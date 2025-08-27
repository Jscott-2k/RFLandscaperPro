import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { validatePasswordStrength } from './password.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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
    const payload = { username: user.username, sub: user.id, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      refresh_token: await this.jwtService.signAsync(payload, {
        expiresIn: '7d',
      }),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<User> {
    // Validate password strength
    validatePasswordStrength(registerDto.password);

    return this.usersService.create(registerDto);
  }

  async requestPasswordReset(username: string): Promise<void> {
    await this.usersService.requestPasswordReset(username);
  }

  async resetPassword(token: string, password: string): Promise<void> {
    // Validate new password strength
    validatePasswordStrength(password);

    await this.usersService.resetPassword(token, password);
  }

  async refresh(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{
        username: string;
        sub: number;
        role: UserRole;
      }>(token);
      return {
        access_token: await this.jwtService.signAsync({
          username: payload.username,
          sub: payload.sub,
          role: payload.role,
        }),
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}

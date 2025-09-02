import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  UsePipes,
  ValidationPipe,
  HttpCode,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { parse } from 'cookie';
import { type Response, type Request } from 'express';

import { Public } from '../common/decorators/public.decorator';
import { type User } from '../users/user.entity';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { type RegisterDto } from './dto/register.dto';
import { type RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { type ResetPasswordDto } from './dto/reset-password.dto';
import { SignupOwnerDto } from './dto/signup-owner.dto';
import { type SwitchCompanyDto } from './dto/switch-company.dto';
import { type VerifyEmailDto } from './dto/verify-email.dto';
import { type JwtUserPayload } from './interfaces/jwt-user-payload.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup-owner')
  @ApiOperation({ summary: 'Self-register a new company owner' })
  @ApiResponse({ description: 'Created owner and company', status: 201 })
  async signupOwner(@Body() dto: SignupOwnerDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.signupOwner(dto);
    res.cookie('refreshToken', result.refresh_token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: true,
      path: '/',
    });
    return { access_token: result.access_token };
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @UsePipes(
    new ValidationPipe({
      errorHttpStatusCode: 400,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
    }),
  )
  @ApiOperation({ summary: 'Authenticate user and return JWT' })
  @ApiResponse({ description: 'JWT token payload', status: 200 })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user: User = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    const result = await this.authService.login(user);
    res.cookie('refreshToken', result.refresh_token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: true,
      path: '/',
    });
    return { access_token: result.access_token };
  }

  @Post('switch-company')
  @ApiOperation({ summary: 'Switch active company for user' })
  @ApiResponse({ description: 'New JWT for selected company', status: 200 })
  async switchCompany(
    @Body() dto: SwitchCompanyDto,
    @Req() req: { user: JwtUserPayload },
  ) {
    return this.authService.switchCompany(req.user, dto.companyId);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ description: 'Created user', status: 201 })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('verify-email')
  @ApiOperation({ summary: 'Verify user email' })
  @ApiResponse({ description: 'Email verified', status: 200 })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ message: string }> {
    await this.authService.verifyEmail(dto.token);
    return { message: 'Email verified' };
  }

  @Public()
  @Post('request-password-reset')
  @ApiOperation({ summary: 'Request a password reset token' })
  @ApiResponse({ description: 'Token sent if user exists', status: 200 })
  async requestPasswordReset(
    @Body() requestDto: RequestPasswordResetDto,
  ): Promise<{ message: string }> {
    await this.authService.requestPasswordReset(requestDto.email);
    return { message: 'Password reset token sent' };
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponse({ description: 'Password reset successful', status: 200 })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.resetPassword(dto.token, dto.password);
    return { message: 'Password reset successful' };
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ description: 'New access token', status: 200 })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = this.getRefreshToken(req);
    if (!token) {
      throw new UnauthorizedException('No refresh token');
    }
    const result = await this.authService.refresh(token);
    res.cookie('refreshToken', result.refresh_token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: true,
      path: '/',
    });
    return { access_token: result.access_token };
  }

  @Public()
  @Post('logout')
  @ApiOperation({ summary: 'Logout current user' })
  @ApiResponse({ description: 'Logged out', status: 200 })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const token = this.getRefreshToken(req);
    if (token) {
      await this.authService.logout(token);
    }
    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'strict',
      secure: true,
      path: '/',
    });
    return { message: 'Logged out' };
  }

  private getRefreshToken(req: Request): string | undefined {
    const cookies = req.headers?.cookie ? parse(req.headers.cookie) : {};
    return cookies['refreshToken'];
  }
}

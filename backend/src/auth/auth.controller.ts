import {
  Controller,
  Post,
  Body,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../common/decorators/public.decorator';
import { User } from '../users/user.entity';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { SignupOwnerDto } from './dto/signup-owner.dto';
import { SwitchCompanyDto } from './dto/switch-company.dto';
import { JwtUserPayload } from './interfaces/jwt-user-payload.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup-owner')
  @ApiOperation({ summary: 'Self-register a new company owner' })
  @ApiResponse({ status: 201, description: 'Created owner and company' })
  async signupOwner(@Body() dto: SignupOwnerDto) {
    return this.authService.signupOwner(dto);
  }

  @Public()
  @Post('login')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      errorHttpStatusCode: 400,
    }),
  )
  @ApiOperation({ summary: 'Authenticate user and return JWT' })
  @ApiResponse({ status: 200, description: 'JWT token payload' })
  async login(@Body() loginDto: LoginDto) {
    const user: User = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    return this.authService.login(user);
  }

  @Post('switch-company')
  @ApiOperation({ summary: 'Switch active company for user' })
  @ApiResponse({ status: 200, description: 'New JWT for selected company' })
  async switchCompany(
    @Body() dto: SwitchCompanyDto,
    @Req() req: { user: JwtUserPayload },
  ) {
    return this.authService.switchCompany(req.user, dto.companyId);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'Created user' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('verify-email')
  @ApiOperation({ summary: 'Verify user email' })
  @ApiResponse({ status: 200, description: 'Email verified' })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ message: string }> {
    await this.authService.verifyEmail(dto.token);
    return { message: 'Email verified' };
  }

  @Public()
  @Post('request-password-reset')
  @ApiOperation({ summary: 'Request a password reset token' })
  @ApiResponse({ status: 200, description: 'Token sent if user exists' })
  async requestPasswordReset(
    @Body() requestDto: RequestPasswordResetDto,
  ): Promise<{ message: string }> {
    await this.authService.requestPasswordReset(requestDto.email);
    return { message: 'Password reset token sent' };
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.resetPassword(dto.token, dto.password);
    return { message: 'Password reset successful' };
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'New access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Post('logout')
  @ApiOperation({ summary: 'Logout current user' })
  @ApiResponse({ status: 200, description: 'Logged out' })
  async logout(@Body() dto: RefreshTokenDto): Promise<{ message: string }> {
    await this.authService.logout(dto.refreshToken);
    return { message: 'Logged out' };
  }
}

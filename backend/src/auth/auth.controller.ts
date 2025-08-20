import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { User } from '../users/user.entity';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Authenticate user and return JWT' })
  @ApiResponse({ status: 200, description: 'JWT token payload' })
  async login(@Body() loginDto: LoginDto) {
    const user: User = await this.authService.validateUser(
      loginDto.username,
      loginDto.password,
    );
    return this.authService.login(user);
  }
}

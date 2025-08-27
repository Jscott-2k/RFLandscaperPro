import { Body, Controller, Get, Post, Put, Req } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './user.entity';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(UserRole.Admin)
  @Post()
  @ApiOperation({ summary: 'Create user' })
  @ApiResponse({ status: 201, description: 'User created', type: User })
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user', type: User })
  async getMe(
    @Req() req: { user: { userId: number } },
  ): Promise<Omit<User, 'password'>> {
    const user = await this.usersService.findById(req.user.userId);
    const { password: _password, ...result } = user;
    void _password;
    return result;
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Updated user', type: User })
  async updateMe(
    @Req() req: { user: { userId: number } },
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.usersService.updateProfile(
      req.user.userId,
      updateUserDto,
    );
    const { password: _password, ...result } = user;
    void _password;
    return result;
  }
}

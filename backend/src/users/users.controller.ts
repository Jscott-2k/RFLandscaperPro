import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './user.entity';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto';
import { toUserResponseDto } from './users.mapper';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(UserRole.Admin, UserRole.Owner)
  @Post()
  @ApiOperation({ summary: 'Create user' })
  @ApiResponse({
    status: 201,
    description: 'User created',
    type: UserResponseDto,
  })
  async create(
    @Req() req: { user: { userId: number; role: UserRole } },
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    if (req.user.role === UserRole.Owner) {
      if (createUserDto.role && createUserDto.role !== UserRole.Worker) {
        throw new BadRequestException('Owners can only create workers');
      }
      const owner = await this.usersService.findById(req.user.userId);
      if (!owner?.companyId) {
        throw new NotFoundException('Owner company not found');
      }
      createUserDto.role = UserRole.Worker;
      createUserDto.companyId = owner.companyId;
    }
    const user = await this.usersService.create(createUserDto);
    return toUserResponseDto(user);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Current user',
    type: UserResponseDto,
  })
  async getMe(
    @Req() req: { user: { userId: number } },
  ): Promise<UserResponseDto> {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) throw new NotFoundException('User not found');
    return toUserResponseDto(user);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Updated user',
    type: UserResponseDto,
  })
  async updateMe(
    @Req() req: { user: { userId: number } },
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.updateProfile(
      req.user.userId,
      updateUserDto,
    );
    // ensure service throws or never returns null; otherwise check like getMe
    return toUserResponseDto(user);
  }
}

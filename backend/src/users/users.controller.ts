import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  Req,
  NotFoundException,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Company } from '../common/decorators/company.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
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
      if (!owner?.company) {
        throw new NotFoundException('Owner company not found');
      }
      createUserDto.role = UserRole.Worker;
      createUserDto.company = { name: owner.company.name };
    }
    const user = await this.usersService.create(createUserDto);
    return toUserResponseDto(user);
  }

  @Get()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'List users' })
  @ApiResponse({
    status: 200,
    description: 'List of users',
    type: [UserResponseDto],
  })
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersService.findAll();
    return users.map(toUserResponseDto);
  }

  @Get('workers')
  @Roles(UserRole.Owner)
  @ApiOperation({ summary: 'List company workers' })
  @ApiResponse({
    status: 200,
    description: 'List of workers',
    type: [UserResponseDto],
  })
  async findWorkers(@Company() companyId: number): Promise<UserResponseDto[]> {
    const users = await this.usersService.findAll(companyId);
    return users
      .filter((u) => u.role === UserRole.Worker)
      .map(toUserResponseDto);
  }

  @Get(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved',
    type: UserResponseDto,
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return toUserResponseDto(user);
  }

  @Patch(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({
    status: 200,
    description: 'User updated',
    type: UserResponseDto,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.update(id, updateUserDto);
    return toUserResponseDto(user);
  }

  @Patch('workers/:id')
  @Roles(UserRole.Owner)
  @ApiOperation({ summary: 'Update company worker' })
  @ApiResponse({
    status: 200,
    description: 'Worker updated',
    type: UserResponseDto,
  })
  async updateWorker(
    @Company() companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const worker = await this.usersService.findById(id, companyId);
    if (!worker || worker.role !== UserRole.Worker) {
      throw new NotFoundException('Worker not found');
    }
    const updated = await this.usersService.update(
      id,
      updateUserDto,
      companyId,
    );
    return toUserResponseDto(updated);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.usersService.remove(id);
  }

  @Patch(':id/role')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Update user role' })
  @ApiResponse({
    status: 200,
    description: 'User role updated',
    type: UserResponseDto,
  })
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.updateRole(id, dto.role);
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

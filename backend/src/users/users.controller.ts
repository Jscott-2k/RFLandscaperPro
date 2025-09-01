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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CompanyId } from '../common/decorators/company-id.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { type CreateUserDto } from './dto/create-user.dto';
import { type UpdateUserRoleDto } from './dto/update-user-role.dto';
import { type UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserRole } from './user.entity';
import { toUserResponseDto } from './users.mapper';
import { type UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(UserRole.CompanyAdmin, UserRole.CompanyOwner)
  @Post()
  @ApiOperation({ summary: 'Create user' })
  @ApiResponse({
    description: 'User created',
    status: 201,
    type: UserResponseDto,
  })
  async create(
    @Req() req: { user: { userId: number; role: UserRole } },
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    if (req.user.role === UserRole.CompanyOwner) {
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
  @Roles(UserRole.CompanyAdmin)
  @ApiOperation({ summary: 'List users' })
  @ApiResponse({
    description: 'List of users',
    status: 200,
    type: [UserResponseDto],
  })
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersService.findAll();
    return users.map(toUserResponseDto);
  }

  @Get('workers')
  @Roles(UserRole.CompanyOwner)
  @ApiOperation({ summary: 'List company workers' })
  @ApiResponse({
    description: 'List of workers',
    status: 200,
    type: [UserResponseDto],
  })
  async findWorkers(
    @CompanyId() companyId: number,
  ): Promise<UserResponseDto[]> {
    const users = await this.usersService.findAll(companyId);
    return users
      .filter((u) => u.role === UserRole.Worker)
      .map(toUserResponseDto);
  }

  @Get(':id')
  @Roles(UserRole.CompanyAdmin)
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({
    description: 'User retrieved',
    status: 200,
    type: UserResponseDto,
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.findById(id);
    if (!user) {throw new NotFoundException('User not found');}
    return toUserResponseDto(user);
  }

  @Patch(':id')
  @Roles(UserRole.CompanyAdmin)
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({
    description: 'User updated',
    status: 200,
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
  @Roles(UserRole.CompanyOwner)
  @ApiOperation({ summary: 'Update company worker' })
  @ApiResponse({
    description: 'Worker updated',
    status: 200,
    type: UserResponseDto,
  })
  async updateWorker(
    @CompanyId() companyId: number,
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
  @Roles(UserRole.CompanyAdmin)
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ description: 'User deleted', status: 204 })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.usersService.remove(id);
  }

  @Patch(':id/role')
  @Roles(UserRole.CompanyAdmin)
  @ApiOperation({ summary: 'Update user role' })
  @ApiResponse({
    description: 'User role updated',
    status: 200,
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
    description: 'Current user',
    status: 200,
    type: UserResponseDto,
  })
  async getMe(
    @Req() req: { user: { userId: number } },
  ): Promise<UserResponseDto> {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) {throw new NotFoundException('User not found');}
    return toUserResponseDto(user);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    description: 'Updated user',
    status: 200,
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

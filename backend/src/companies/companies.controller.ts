import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CompanyResponseDto } from './dto/company-response.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser } from '../common/decorators/auth-user.decorator';
import { User, UserRole } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { toUserResponseDto } from '../users/users.mapper';
import { UserResponseDto } from '../users/dto/user-response.dto';

@ApiTags('companies')
@ApiBearerAuth()
@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly usersService: UsersService,
  ) {}

  @Get('profile')
  async getProfile(@AuthUser() user: User): Promise<CompanyResponseDto> {
    const company = await this.companiesService.findByUserId(user.id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  @Roles(UserRole.Owner)
  @Get('workers')
  async getWorkers(@AuthUser() user: User): Promise<UserResponseDto[]> {
    const owner = await this.usersService.findById(user.id);
    if (!owner?.companyId)
      throw new NotFoundException('Owner company not found');
    const workers = await this.companiesService.findWorkers(owner.companyId);
    return workers.map(toUserResponseDto);
  }

  @Roles(UserRole.Owner, UserRole.Admin)
  @Post()
  async create(
    @Body() dto: CreateCompanyDto,
    @AuthUser() user: User,
  ): Promise<CompanyResponseDto> {
    return this.companiesService.create(dto, user.id);
  }

  @Roles(UserRole.Owner, UserRole.Admin)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompanyDto,
    @AuthUser() user: User,
  ): Promise<CompanyResponseDto> {
    if (user.companyId !== id)
      throw new NotFoundException('Company not found');
    return this.companiesService.update(id, dto);
  }
}

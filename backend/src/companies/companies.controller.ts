import {
  Controller,
  Get,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CompanyResponseDto } from './dto/company-response.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
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
  async getProfile(
    @Req() req: { user: { userId: number } },
  ): Promise<CompanyResponseDto> {
    const company = await this.companiesService.findByUserId(
      req.user.userId,
    );
    if (!company) throw new NotFoundException('Company not found');
    return { id: company.id, name: company.name };
  }

  @Roles(UserRole.Owner)
  @Get('workers')
  async getWorkers(
    @Req() req: { user: { userId: number } },
  ): Promise<UserResponseDto[]> {
    const owner = await this.usersService.findById(req.user.userId);
    if (!owner?.companyId)
      throw new NotFoundException('Owner company not found');
    const workers = await this.companiesService.findWorkers(owner.companyId);
    return workers.map(toUserResponseDto);
  }
}

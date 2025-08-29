import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CompanyUser,
  CompanyUserRole,
  CompanyUserStatus,
} from '../companies/entities/company-user.entity';
import { Company } from '../companies/entities/company.entity';
import { AuthUser } from '../common/decorators/auth-user.decorator';
import { User, UserRole } from './user.entity';
import { CompanyMembershipResponseDto } from './dto/company-membership-response.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('me')
@ApiBearerAuth()
@Controller('me')
export class MeController {
  constructor(
    @InjectRepository(CompanyUser)
    private readonly companyUsersRepository: Repository<CompanyUser>,
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
  ) {}

  @Get('companies')
  async listCompanies(
    @AuthUser() user: User | undefined,
  ): Promise<CompanyMembershipResponseDto[]> {
    if (user?.role === UserRole.Master) {
      const companies = await this.companiesRepository.find();
      return companies.map((c) => ({
        companyId: c.id,
        companyName: c.name ?? '',
        role: CompanyUserRole.ADMIN,
      }));
    }
    const memberships = await this.companyUsersRepository.find({
      where: { userId: user!.id, status: CompanyUserStatus.ACTIVE },
      relations: ['company'],
    });
    return memberships.map((m) => ({
      companyId: m.companyId,
      companyName: m.company?.name ?? '',
      role: m.role,
    }));
  }
}

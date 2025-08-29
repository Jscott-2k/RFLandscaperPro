import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CompanyUser,
  CompanyUserStatus,
} from '../companies/entities/company-user.entity';
import { AuthUser } from '../common/decorators/auth-user.decorator';
import { User } from './user.entity';
import { CompanyMembershipResponseDto } from './dto/company-membership-response.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('me')
@ApiBearerAuth()
@Controller('me')
export class MeController {
  constructor(
    @InjectRepository(CompanyUser)
    private readonly companyUsersRepository: Repository<CompanyUser>,
  ) {}

  @Get('companies')
  async listCompanies(
    @AuthUser() user: User | undefined,
  ): Promise<CompanyMembershipResponseDto[]> {
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

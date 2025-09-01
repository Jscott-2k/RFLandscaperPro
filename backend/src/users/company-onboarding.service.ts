import { BadRequestException, Injectable } from '@nestjs/common';
import { type EntityManager } from 'typeorm';

import { type CreateCompanyDto } from '../companies/dto/create-company.dto';
import { Company } from '../companies/entities/company.entity';
import { User, UserRole } from './user.entity';

@Injectable()
export class CompanyOnboardingService {
  async onboard(
    user: User,
    company: CreateCompanyDto | undefined,
    manager: EntityManager,
  ) {
    if (!company) {
      throw new BadRequestException(
        'Company information is required for company owner and worker accounts',
      );
    }
    const companyRepository = manager.getRepository(Company);
    let existing = await companyRepository.findOne({
      where: { name: company.name },
    });
    if (!existing) {
      existing = companyRepository.create({
        ...company,
        ownerId: user.role === UserRole.CompanyOwner ? user.id : undefined,
      });
      existing = await companyRepository.save(existing);
    }
    user.companyId = existing.id;
    await manager.getRepository(User).save(user);
    return existing;
  }
}

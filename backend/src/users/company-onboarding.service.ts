import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Company } from '../companies/entities/company.entity';
import { CreateCompanyDto } from '../companies/dto/create-company.dto';
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
        'Company information is required for owner and worker accounts',
      );
    }
    const companyRepository = manager.getRepository(Company);
    let existing = await companyRepository.findOne({
      where: { name: company.name },
    });
    if (!existing) {
      existing = companyRepository.create({
        ...company,
        ownerId: user.role === UserRole.Owner ? user.id : undefined,
      });
      existing = await companyRepository.save(existing);
    }
    user.companyId = existing.id;
    await manager.getRepository(User).save(user);
    return existing;
  }
}

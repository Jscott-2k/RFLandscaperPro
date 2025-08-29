import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions } from 'typeorm';
import { CompanyUser } from '../../companies/entities/company-user.entity';

export interface CompanyMembershipRepository {
  findOne(options: FindOneOptions<CompanyUser>): Promise<CompanyUser | null>;
}

export const COMPANY_MEMBERSHIP_REPOSITORY = Symbol(
  'CompanyMembershipRepository',
);

@Injectable()
export class TypeOrmCompanyMembershipRepository
  implements CompanyMembershipRepository
{
  constructor(
    @InjectRepository(CompanyUser)
    private readonly repository: Repository<CompanyUser>,
  ) {}

  findOne(options: FindOneOptions<CompanyUser>): Promise<CompanyUser | null> {
    return this.repository.findOne(options);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByUserId(userId: number): Promise<Company | null> {
    return this.companyRepository
      .createQueryBuilder('company')
      .innerJoin('company.users', 'user', 'user.id = :userId', { userId })
      .getOne();
  }

  findWorkers(companyId: number): Promise<User[]> {
    return this.usersRepository.find({
      where: { companyId, role: UserRole.Worker },
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { User, UserRole } from '../users/user.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

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

  async create(
    dto: CreateCompanyDto,
    ownerId: number,
  ): Promise<Company> {
    const company = this.companyRepository.create({ ...dto, ownerId });
    return this.companyRepository.save(company);
  }

  async update(id: number, dto: UpdateCompanyDto): Promise<Company> {
    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    Object.assign(company, dto);
    return this.companyRepository.save(company);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type Repository } from 'typeorm';

import { User, UserRole } from '../users/user.entity';
import { type CompanyResponseDto } from './dto/company-response.dto';
import { type CreateCompanyDto } from './dto/create-company.dto';
import { type UpdateCompanyDto } from './dto/update-company.dto';
import { Company } from './entities/company.entity';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findByUserId(userId: number): Promise<CompanyResponseDto | null> {
    const company = await this.companyRepository
      .createQueryBuilder('company')
      .innerJoin('company.users', 'user', 'user.id = :userId', { userId })
      .getOne();
    return company ? this.toCompanyResponseDto(company) : null;
  }

  findWorkers(companyId: number): Promise<User[]> {
    return this.usersRepository.find({
      where: { companyId, role: UserRole.Worker },
    });
  }

  async create(
    dto: CreateCompanyDto,
    ownerId: number,
  ): Promise<CompanyResponseDto> {
    const company = this.companyRepository.create({ ...dto, ownerId });
    const saved = await this.companyRepository.save(company);
    return this.toCompanyResponseDto(saved);
  }

  async update(id: number, dto: UpdateCompanyDto): Promise<CompanyResponseDto> {
    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) {throw new NotFoundException('Company not found');}
    Object.assign(company, dto);
    const saved = await this.companyRepository.save(company);
    return this.toCompanyResponseDto(saved);
  }

  private toCompanyResponseDto(company: Company): CompanyResponseDto {
    return {
      address: company.address ?? null,
      email: company.email ?? null,
      id: company.id,
      name: company.name,
      ownerId: company.ownerId ?? null,
      phone: company.phone ?? null,
    };
  }
}

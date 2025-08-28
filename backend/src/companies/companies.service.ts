import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { User, UserRole } from '../users/user.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyResponseDto } from './dto/company-response.dto';

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
    if (!company) throw new NotFoundException('Company not found');
    Object.assign(company, dto);
    const saved = await this.companyRepository.save(company);
    return this.toCompanyResponseDto(saved);
  }

  private toCompanyResponseDto(company: Company): CompanyResponseDto {
    return {
      id: company.id,
      name: company.name,
      address: company.address ?? null,
      phone: company.phone ?? null,
      email: company.email ?? null,
      ownerId: company.ownerId ?? null,
    };
  }
}

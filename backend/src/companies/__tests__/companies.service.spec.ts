import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CompaniesService } from '../companies.service';
import { Company } from '../entities/company.entity';
import { User } from '../../users/user.entity';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { UpdateCompanyDto } from '../dto/update-company.dto';

describe('CompaniesService', () => {
  let service: CompaniesService;
  let companyRepository: { create: jest.Mock; save: jest.Mock; findOne: jest.Mock };
  let userRepository: { find: jest.Mock };

  beforeEach(async () => {
    companyRepository = { create: jest.fn(), save: jest.fn(), findOne: jest.fn() };
    userRepository = { find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: getRepositoryToken(Company), useValue: companyRepository },
        { provide: getRepositoryToken(User), useValue: userRepository },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
  });

  it('should create a company', async () => {
    const dto: CreateCompanyDto = { name: 'Acme' };
    const ownerId = 1;
    const company = {
      id: 1,
      name: 'Acme',
      address: null,
      phone: null,
      email: null,
      ownerId,
    };
    companyRepository.create.mockReturnValue(company);
    companyRepository.save.mockResolvedValue(company);

    const result = await service.create(dto, ownerId);

    expect(companyRepository.create).toHaveBeenCalledWith({ ...dto, ownerId });
    expect(companyRepository.save).toHaveBeenCalledWith(company);
    expect(result).toEqual(company);
  });

  it('should throw NotFoundException when updating non-existent company', async () => {
    companyRepository.findOne.mockResolvedValue(null);
    const dto: UpdateCompanyDto = { name: 'NewName' };
    await expect(service.update(1, dto)).rejects.toBeInstanceOf(NotFoundException);
  });
});

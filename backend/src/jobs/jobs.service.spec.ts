import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { Job } from './entities/job.entity';
import { Customer } from '../customers/entities/customer.entity';
import { JobImage } from './entities/job-image.entity';

describe('JobsService', () => {
  let service: JobsService;
  let jobRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let customerRepository: { findOne: jest.Mock };
  let imageRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    jobRepository = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
    customerRepository = { findOne: jest.fn() };
    imageRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: getRepositoryToken(Job),
          useValue: jobRepository,
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: customerRepository,
        },
        {
          provide: getRepositoryToken(JobImage),
          useValue: imageRepository,
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw NotFoundException when job does not exist', async () => {
    jobRepository.findOne.mockResolvedValue(null);
    await expect(service.findOne(1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should throw NotFoundException when customer does not exist on create', async () => {
    customerRepository.findOne.mockResolvedValue(null);
    await expect(
      service.create({
        title: 'Test',
        customerId: 1,
      } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

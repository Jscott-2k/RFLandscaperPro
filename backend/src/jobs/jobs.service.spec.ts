import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { JobsService } from './jobs.service';
import { Job } from './entities/job.entity';
import { Customer } from '../customers/entities/customer.entity';
import { NotificationService } from '../common/notification.service';

describe('JobsService', () => {
  let service: JobsService;
  let jobRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let customerRepository: { findOne: jest.Mock };
  let schedulerRegistry: {
    doesExist: jest.Mock;
    deleteTimeout: jest.Mock;
    addTimeout: jest.Mock;
  };
  let notificationService: { sendJobReminder: jest.Mock };

  beforeEach(async () => {
    jobRepository = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
    customerRepository = { findOne: jest.fn() };
    schedulerRegistry = {
      doesExist: jest.fn().mockReturnValue(false),
      deleteTimeout: jest.fn(),
      addTimeout: jest.fn(),
    };
    notificationService = { sendJobReminder: jest.fn() };

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
        { provide: SchedulerRegistry, useValue: schedulerRegistry },
        { provide: NotificationService, useValue: notificationService },
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

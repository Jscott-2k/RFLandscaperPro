import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { Job } from './entities/job.entity';
import { Customer } from '../customers/entities/customer.entity';
import { User } from '../users/user.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
import { Assignment } from './entities/assignment.entity';

describe('JobsService', () => {
  let service: JobsService;
  let jobRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let customerRepository: { findOne: jest.Mock };
  let userRepository: { findOne: jest.Mock };
  let equipmentRepository: { findOne: jest.Mock };
  let assignmentRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  beforeEach(async () => {
    jobRepository = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
    customerRepository = { findOne: jest.fn() };
    userRepository = { findOne: jest.fn() };
    equipmentRepository = { findOne: jest.fn() };
    assignmentRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
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
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Equipment), useValue: equipmentRepository },
        { provide: getRepositoryToken(Assignment), useValue: assignmentRepository },
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

  it('should throw ConflictException when scheduling with existing assignment conflict', async () => {
    const date = new Date();
    jobRepository.findOne.mockResolvedValue({
      id: 1,
      assignments: [
        {
          user: { id: 1 },
          equipment: { id: 2 },
        },
      ],
      customer: {},
    });

    const qb = {
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({ id: 99 }),
    };
    assignmentRepository.createQueryBuilder.mockReturnValue(qb);

    await expect(
      service.schedule(1, { scheduledDate: date } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should throw ConflictException when assigning user or equipment already booked', async () => {
    const date = new Date();
    jobRepository.findOne.mockResolvedValue({ id: 1, scheduledDate: date, customer: {} });
    userRepository.findOne.mockResolvedValue({ id: 1 });
    equipmentRepository.findOne.mockResolvedValue({ id: 2 });

    const qb = {
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({ id: 99 }),
    };
    assignmentRepository.createQueryBuilder.mockReturnValue(qb);

    await expect(
      service.assign(1, { userId: 1, equipmentId: 2 } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

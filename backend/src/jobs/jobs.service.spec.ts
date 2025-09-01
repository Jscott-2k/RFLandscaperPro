import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import {
  CUSTOMER_REPOSITORY,
  type ICustomerRepository,
} from '../customers/repositories/customer.repository';
import {
  EQUIPMENT_REPOSITORY,
  type IEquipmentRepository,
} from '../equipment/repositories/equipment.repository';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../users/repositories/user.repository';
import { type AssignJobDto } from './dto/assign-job.dto';
import { type CreateJobDto } from './dto/create-job.dto';
import { type ScheduleJobDto } from './dto/schedule-job.dto';
import { JobsService } from './jobs.service';
import {
  ASSIGNMENT_REPOSITORY,
  type IAssignmentRepository,
} from './repositories/assignment.repository';
import { JOB_REPOSITORY, type IJobRepository } from './repositories/job.repository';

describe('JobsService', () => {
  let service: JobsService;
  let jobRepo: jest.Mocked<IJobRepository>;
  let customerRepo: jest.Mocked<ICustomerRepository>;
  let userRepo: jest.Mocked<IUserRepository>;
  let equipmentRepo: jest.Mocked<IEquipmentRepository>;
  let assignmentRepo: jest.Mocked<IAssignmentRepository>;

  beforeEach(async () => {
    jobRepo = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      remove: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<IJobRepository>;
    customerRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ICustomerRepository>;
    userRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IUserRepository>;
    equipmentRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IEquipmentRepository>;
    assignmentRepo = {
      bulkCreate: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      hasConflict: jest.fn(),
      remove: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<IAssignmentRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: JOB_REPOSITORY, useValue: jobRepo },
        { provide: CUSTOMER_REPOSITORY, useValue: customerRepo },
        { provide: USER_REPOSITORY, useValue: userRepo },
        { provide: EQUIPMENT_REPOSITORY, useValue: equipmentRepo },
        { provide: ASSIGNMENT_REPOSITORY, useValue: assignmentRepo },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('throws NotFoundException when customer missing on create', async () => {
    customerRepo.findById.mockResolvedValue(null);
    const dto: CreateJobDto = { customerId: 1, title: 'Test' };
    await expect(service.create(dto, 1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws ConflictException when scheduling with resource conflict', async () => {
    jobRepo.findById.mockResolvedValue({
      assignments: [{ equipment: { id: 2 }, user: { id: 1 } }],
    } as any);
    assignmentRepo.hasConflict.mockResolvedValue(true);
    const dto: ScheduleJobDto = { scheduledDate: new Date() };
    await expect(service.schedule(1, dto, 1)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('throws ConflictException when assigning conflicting resources', async () => {
    jobRepo.findById.mockResolvedValue({
      customer: {},
      scheduledDate: new Date(),
    } as any);
    userRepo.findById.mockResolvedValue({ id: 1 } as any);
    equipmentRepo.findById.mockResolvedValue({ id: 2 } as any);
    assignmentRepo.hasConflict.mockResolvedValue(true);
    const dto: AssignJobDto = { equipmentId: 2, userId: 1 };
    await expect(service.assign(1, dto, 1)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

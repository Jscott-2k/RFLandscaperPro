import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JOB_REPOSITORY, IJobRepository } from './repositories/job.repository';
import {
  CUSTOMER_REPOSITORY,
  ICustomerRepository,
} from '../customers/repositories/customer.repository';
import {
  USER_REPOSITORY,
  IUserRepository,
} from '../users/repositories/user.repository';
import {
  EQUIPMENT_REPOSITORY,
  IEquipmentRepository,
} from '../equipment/repositories/equipment.repository';
import {
  ASSIGNMENT_REPOSITORY,
  IAssignmentRepository,
} from './repositories/assignment.repository';
import { CreateJobDto } from './dto/create-job.dto';
import { AssignJobDto } from './dto/assign-job.dto';
import { ScheduleJobDto } from './dto/schedule-job.dto';

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
      save: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      remove: jest.fn(),
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
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      remove: jest.fn(),
      hasConflict: jest.fn(),
      bulkCreate: jest.fn(),
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
    const dto: CreateJobDto = { title: 'Test', customerId: 1 };
    await expect(service.create(dto, 1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws ConflictException when scheduling with resource conflict', async () => {
    jobRepo.findById.mockResolvedValue({
      assignments: [{ user: { id: 1 }, equipment: { id: 2 } }],
    } as any);
    assignmentRepo.hasConflict.mockResolvedValue(true);
    const dto: ScheduleJobDto = { scheduledDate: new Date() };
    await expect(service.schedule(1, dto, 1)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('throws ConflictException when assigning conflicting resources', async () => {
    jobRepo.findById.mockResolvedValue({
      scheduledDate: new Date(),
      customer: {},
    } as any);
    userRepo.findById.mockResolvedValue({ id: 1 } as any);
    equipmentRepo.findById.mockResolvedValue({ id: 2 } as any);
    assignmentRepo.hasConflict.mockResolvedValue(true);
    const dto: AssignJobDto = { userId: 1, equipmentId: 2 };
    await expect(service.assign(1, dto, 1)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

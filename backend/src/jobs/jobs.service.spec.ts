import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { Job } from './entities/job.entity';
import { Customer } from '../customers/entities/customer.entity';
import { User } from '../users/user.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
import { Assignment } from './entities/assignment.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { ScheduleJobDto } from './dto/schedule-job.dto';
import { AssignJobDto } from './dto/assign-job.dto';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
describe('JobsService', () => {
  let service: JobsService;
  let jobRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
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
    jobRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
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
        {
          provide: getRepositoryToken(Equipment),
          useValue: equipmentRepository,
        },
        {
          provide: getRepositoryToken(Assignment),
          useValue: assignmentRepository,
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should apply filters when finding all jobs', async () => {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    jobRepository.createQueryBuilder.mockReturnValue(qb);

    const pagination = { page: 1, limit: 10 } as any;
    const startDate = new Date('2023-01-01');
    const endDate = new Date('2023-01-31');
    await service.findAll(pagination, 1, true, 2, startDate, endDate, 3, 4);

    expect(qb.andWhere).toHaveBeenCalledWith('job.completed = :completed', {
      completed: true,
    });
    expect(qb.andWhere).toHaveBeenCalledWith('job.customer.id = :customerId', {
      customerId: 2,
    });
    expect(qb.andWhere).toHaveBeenCalledWith(
      'job.scheduledDate >= :startDate',
      { startDate },
    );
    expect(qb.andWhere).toHaveBeenCalledWith('job.scheduledDate <= :endDate', {
      endDate,
    });
    expect(qb.andWhere).toHaveBeenCalledWith('user.id = :workerId', {
      workerId: 3,
    });
    expect(qb.andWhere).toHaveBeenCalledWith('equipment.id = :equipmentId', {
      equipmentId: 4,
    });
    expect(qb.getManyAndCount).toHaveBeenCalled();
  });

  it('should throw NotFoundException when job does not exist', async () => {
    jobRepository.findOne.mockResolvedValue(null);
    await expect(service.findOne(1, 1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should throw NotFoundException when customer does not exist on create', async () => {
    customerRepository.findOne.mockResolvedValue(null);
    const createJobDto: CreateJobDto = {
      title: 'Test',
      customerId: 1,
    };
    await expect(service.create(createJobDto, 1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
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

    const scheduleJobDto: ScheduleJobDto = { scheduledDate: date };
    await expect(service.schedule(1, scheduleJobDto, 1)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('should throw ConflictException when assigning user or equipment already booked', async () => {
    const date = new Date();
    jobRepository.findOne.mockResolvedValue({
      id: 1,
      scheduledDate: date,
      customer: {},
    });
    userRepository.findOne.mockResolvedValue({ id: 1 });
    equipmentRepository.findOne.mockResolvedValue({ id: 2 });

    const qb = {
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({ id: 99 }),
    };
    assignmentRepository.createQueryBuilder.mockReturnValue(qb);

    const assignJobDto: AssignJobDto = { userId: 1, equipmentId: 2 };
    await expect(service.assign(1, assignJobDto, 1)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

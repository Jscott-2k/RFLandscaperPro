import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from './entities/job.entity';
import { Customer } from '../customers/entities/customer.entity';
import { JobResponseDto } from './dto/job-response.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { User } from '../users/user.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
import { Assignment } from './entities/assignment.entity';
import { AssignJobDto } from './dto/assign-job.dto';
import { BulkAssignJobDto } from './dto/bulk-assign-job.dto';
import { ScheduleJobDto } from './dto/schedule-job.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>,
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
  ) {}

  async create(
    createJobDto: CreateJobDto,
    companyId: number,
  ): Promise<JobResponseDto> {
    const { customerId, ...jobData } = createJobDto;
    const customer = await this.customerRepository.findOne({
      where: { id: customerId, companyId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found.`);
    }
    const job = this.jobRepository.create({
      ...jobData,
      customer,
      companyId,
    });
    const savedJob = await this.jobRepository.save(job);
    return this.toJobResponseDto(savedJob);
  }

  async findAll(
    pagination: PaginationQueryDto,
    companyId: number,
    completed?: boolean,
    customerId?: number,
    startDate?: Date,
    endDate?: Date,
    workerId?: number,
    equipmentId?: number,
  ): Promise<{ items: JobResponseDto[]; total: number }> {
    const { page = 1, limit = 10 } = pagination;
    const cappedLimit = Math.min(limit, 100);
    const queryBuilder = this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.customer', 'customer')
      .leftJoinAndSelect('job.assignments', 'assignments')
      .leftJoinAndSelect('assignments.user', 'user')
      .leftJoinAndSelect('assignments.equipment', 'equipment')
      .where('job.companyId = :companyId', { companyId });

    if (completed !== undefined) {
      queryBuilder.andWhere('job.completed = :completed', { completed });
    }

    if (customerId) {
      queryBuilder.andWhere('job.customer.id = :customerId', { customerId });
    }

    if (startDate) {
      queryBuilder.andWhere('job.scheduledDate >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('job.scheduledDate <= :endDate', { endDate });
    }

    if (workerId) {
      queryBuilder.andWhere('user.id = :workerId', { workerId });
    }

    if (equipmentId) {
      queryBuilder.andWhere('equipment.id = :equipmentId', { equipmentId });
    }

    const [jobs, total] = await queryBuilder
      .skip((page - 1) * cappedLimit)
      .take(cappedLimit)
      .orderBy('job.scheduledDate', 'ASC')
      .addOrderBy('job.createdAt', 'DESC')
      .getManyAndCount();

    return {
      items: jobs.map((job) => this.toJobResponseDto(job)),
      total,
    };
  }

  async update(
    id: number,
    updateJobDto: UpdateJobDto,
    companyId: number,
  ): Promise<JobResponseDto> {
    const job = await this.jobRepository.findOne({
      where: { id, companyId },
      relations: ['customer'],
    });
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found.`);
    }
    const { customerId, ...updateData } = updateJobDto;
    if (customerId !== undefined) {
      const customer = await this.customerRepository.findOne({
        where: { id: customerId, companyId },
      });
      if (!customer) {
        throw new NotFoundException(
          `Customer with ID ${customerId} not found.`,
        );
      }
      job.customer = customer;
    }
    Object.assign(job, updateData);
    const updatedJob = await this.jobRepository.save(job);
    return this.toJobResponseDto(updatedJob);
  }

  async findOne(id: number, companyId: number): Promise<JobResponseDto> {
    const job = await this.jobRepository.findOne({
      where: { id, companyId },
      relations: [
        'customer',
        'assignments',
        'assignments.user',
        'assignments.equipment',
      ],
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found.`);
    }

    return this.toJobResponseDto(job);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const job = await this.jobRepository.findOne({ where: { id, companyId } });
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found.`);
    }
    await this.jobRepository.remove(job);
  }

  private toJobResponseDto(job: Job): JobResponseDto {
    return {
      id: job.id,
      title: job.title,
      description: job.description,
      scheduledDate: job.scheduledDate,
      completed: job.completed,
      estimatedHours: job.estimatedHours,
      actualHours: job.actualHours,
      notes: job.notes,
      customer: {
        id: job.customer.id,
        name: job.customer.name,
        email: job.customer.email,
      },
      assignments: job.assignments?.map((assignment) => ({
        id: assignment.id,
        user: { id: assignment.user.id, username: assignment.user.username },
        equipment: {
          id: assignment.equipment.id,
          name: assignment.equipment.name,
        },
        startTime: assignment.startTime,
        endTime: assignment.endTime,
        notes: assignment.notes,
      })),
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  private async checkResourceConflicts(
    date: Date,
    userId: number,
    equipmentId: number,
    companyId: number,
    jobId?: number,
  ): Promise<boolean> {
    const query = this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoin('assignment.job', 'job')
      .where('job.scheduledDate = :date', { date })
      .andWhere('assignment.companyId = :companyId', { companyId })
      .andWhere(
        '(assignment.userId = :userId OR assignment.equipmentId = :equipmentId)',
        { userId, equipmentId },
      );

    if (jobId !== undefined) {
      query.andWhere('job.id != :jobId', { jobId });
    }

    const conflict = await query.getOne();
    return !!conflict;
  }

  async schedule(
    id: number,
    scheduleJobDto: ScheduleJobDto,
    companyId: number,
  ): Promise<JobResponseDto> {
    const job = await this.jobRepository.findOne({
      where: { id, companyId },
      relations: ['assignments'],
    });
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found.`);
    }

    for (const assignment of job.assignments || []) {
      const conflict = await this.checkResourceConflicts(
        scheduleJobDto.scheduledDate,
        assignment.user.id,
        assignment.equipment.id,
        companyId,
        id,
      );
      if (conflict) {
        throw new ConflictException(
          'Resource conflict: assigned user or equipment is already booked on this date.',
        );
      }
    }

    job.scheduledDate = scheduleJobDto.scheduledDate;
    const saved = await this.jobRepository.save(job);
    return this.toJobResponseDto(saved);
  }

  async assign(
    id: number,
    dto: AssignJobDto,
    companyId: number,
  ): Promise<JobResponseDto> {
    const job = await this.jobRepository.findOne({
      where: { id, companyId },
      relations: ['customer'],
    });
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found.`);
    }

    const user = await this.userRepository.findOne({
      where: { id: dto.userId, companyId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${dto.userId} not found.`);
    }

    const equipment = await this.equipmentRepository.findOne({
      where: { id: dto.equipmentId, companyId },
    });
    if (!equipment) {
      throw new NotFoundException(
        `Equipment with ID ${dto.equipmentId} not found.`,
      );
    }

    if (job.scheduledDate) {
      const conflict = await this.checkResourceConflicts(
        job.scheduledDate,
        dto.userId,
        dto.equipmentId,
        companyId,
      );
      if (conflict) {
        throw new ConflictException(
          'Resource conflict: user or equipment is already assigned on this date.',
        );
      }
    }

    const assignment = this.assignmentRepository.create({
      job,
      user,
      equipment,
      companyId,
    });
    await this.assignmentRepository.save(assignment);

    const updatedJob = await this.findOne(id, companyId);
    return updatedJob;
  }

  async bulkAssign(
    id: number,
    dto: BulkAssignJobDto,
    companyId: number,
  ): Promise<JobResponseDto> {
    const job = await this.jobRepository.findOne({
      where: { id, companyId },
      relations: ['customer'],
    });
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found.`);
    }

    // Validate all users and equipment exist
    for (const assignment of dto.assignments) {
      const user = await this.userRepository.findOne({
        where: { id: assignment.userId, companyId },
      });
      if (!user) {
        throw new NotFoundException(
          `User with ID ${assignment.userId} not found.`,
        );
      }

      const equipment = await this.equipmentRepository.findOne({
        where: { id: assignment.equipmentId, companyId },
      });
      if (!equipment) {
        throw new NotFoundException(
          `Equipment with ID ${assignment.equipmentId} not found.`,
        );
      }
    }

    // Check for conflicts if job is scheduled
    if (job.scheduledDate) {
      for (const assignment of dto.assignments) {
        const conflict = await this.checkResourceConflicts(
          job.scheduledDate,
          assignment.userId,
          assignment.equipmentId,
          companyId,
        );
        if (conflict) {
          throw new ConflictException(
            `Resource conflict: user ${assignment.userId} or equipment ${assignment.equipmentId} is already assigned on this date.`,
          );
        }
      }
    }

    // Create all assignments within a transaction to ensure atomicity
    await this.assignmentRepository.manager.transaction(async (manager) => {
      const assignments = dto.assignments.map((assignmentData) =>
        manager.create(Assignment, {
          job,
          user: { id: assignmentData.userId } as User,
          equipment: { id: assignmentData.equipmentId } as Equipment,
          companyId,
        }),
      );
      await manager.save(assignments);
    });

    const updatedJob = await this.findOne(id, companyId);
    return updatedJob;
  }

  async removeAssignment(
    jobId: number,
    assignmentId: number,
    companyId: number,
  ): Promise<JobResponseDto> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId, companyId, job: { id: jobId } },
      relations: ['job'],
    });

    if (!assignment) {
      throw new NotFoundException(
        `Assignment with ID ${assignmentId} not found for job ${jobId}.`,
      );
    }

    await this.assignmentRepository.remove(assignment);

    const updatedJob = await this.findOne(jobId, companyId);
    return updatedJob;
  }
}

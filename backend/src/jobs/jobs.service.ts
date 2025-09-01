import {
  ConflictException,
  Injectable,
  NotFoundException,
  Inject,
  Optional,
} from '@nestjs/common';

import { type Paginated, type PaginationParams } from '../common/pagination';
import {
  CUSTOMER_REPOSITORY,
  type ICustomerRepository,
} from '../customers/repositories/customer.repository';
import {
  EQUIPMENT_REPOSITORY,
  type IEquipmentRepository,
} from '../equipment/repositories/equipment.repository';
import { type MetricsService } from '../metrics/metrics.service';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../users/repositories/user.repository';
import { type AssignJobDto } from './dto/assign-job.dto';
import { type BulkAssignJobDto } from './dto/bulk-assign-job.dto';
import { type CreateJobDto } from './dto/create-job.dto';
import { type JobResponseDto } from './dto/job-response.dto';
import { type ScheduleJobDto } from './dto/schedule-job.dto';
import { type UpdateJobDto } from './dto/update-job.dto';
import { toJobResponseDto } from './jobs.mapper';
import {
  ASSIGNMENT_REPOSITORY,
  type IAssignmentRepository,
} from './repositories/assignment.repository';
import { JOB_REPOSITORY, type IJobRepository } from './repositories/job.repository';

@Injectable()
export class JobsService {
  constructor(
    @Inject(JOB_REPOSITORY)
    private readonly jobRepository: IJobRepository,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(EQUIPMENT_REPOSITORY)
    private readonly equipmentRepository: IEquipmentRepository,
    @Inject(ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepository: IAssignmentRepository,
    @Optional() private readonly metrics?: MetricsService,
  ) {}

  async create(
    createJobDto: CreateJobDto,
    companyId: number,
  ): Promise<JobResponseDto> {
    const { customerId, ...jobData } = createJobDto;
    const customer = await this.customerRepository.findById(
      customerId,
      companyId,
    );
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found.`);
    }
    const job = this.jobRepository.create({
      ...jobData,
      companyId,
      customer,
    });
    const savedJob = await this.jobRepository.save(job);
    this.metrics?.incrementCounter('jobs_created_total', {
      companyId,
      route: 'jobs.create',
      status: 'success',
    });
    return toJobResponseDto(savedJob);
  }

  async findAll(
    pagination: PaginationParams,
    companyId: number,
    completed?: boolean,
    customerId?: number,
    startDate?: Date,
    endDate?: Date,
    workerId?: number,
    equipmentId?: number,
  ): Promise<Paginated<JobResponseDto>> {
    const { items, nextCursor } = await this.jobRepository.findAll(
      pagination,
      companyId,
      {
        completed,
        customerId,
        endDate,
        equipmentId,
        startDate,
        workerId,
      },
    );

    return {
      items: items.map((job) => toJobResponseDto(job)),
      nextCursor,
    };
  }

  async update(
    id: number,
    updateJobDto: UpdateJobDto,
    companyId: number,
  ): Promise<JobResponseDto> {
    const job = await this.jobRepository.findById(id, companyId, ['customer']);
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found.`);
    }
    const { customerId, ...updateData } = updateJobDto;
    if (customerId !== undefined) {
      const customer = await this.customerRepository.findById(
        customerId,
        companyId,
      );
      if (!customer) {
        throw new NotFoundException(
          `Customer with ID ${customerId} not found.`,
        );
      }
      job.customer = customer;
    }
    Object.assign(job, updateData);
    const updatedJob = await this.jobRepository.save(job);
    return toJobResponseDto(updatedJob);
  }

  async findOne(id: number, companyId: number): Promise<JobResponseDto> {
    const job = await this.jobRepository.findById(id, companyId, [
      'customer',
      'assignments',
      'assignments.user',
      'assignments.equipment',
    ]);

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found.`);
    }

    return toJobResponseDto(job);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const job = await this.jobRepository.findById(id, companyId);
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found.`);
    }
    await this.jobRepository.remove(job);
  }

  private checkResourceConflicts(
    date: Date,
    userId: number,
    equipmentId: number,
    companyId: number,
    jobId?: number,
  ): Promise<boolean> {
    return this.assignmentRepository.hasConflict(
      date,
      userId,
      equipmentId,
      companyId,
      jobId,
    );
  }

  async schedule(
    id: number,
    scheduleJobDto: ScheduleJobDto,
    companyId: number,
  ): Promise<JobResponseDto> {
    const job = await this.jobRepository.findById(id, companyId, [
      'assignments',
    ]);
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found.`);
    }

    for (const assignment of job.assignments || []) {
      const conflict = await this.assignmentRepository.hasConflict(
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
    return toJobResponseDto(saved);
  }

  async assign(
    id: number,
    dto: AssignJobDto,
    companyId: number,
  ): Promise<JobResponseDto> {
    const job = await this.jobRepository.findById(id, companyId, ['customer']);
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found.`);
    }

    const user = await this.userRepository.findById(dto.userId, companyId);
    if (!user) {
      throw new NotFoundException(`User with ID ${dto.userId} not found.`);
    }

    const equipment = await this.equipmentRepository.findById(
      dto.equipmentId,
      companyId,
    );
    if (!equipment) {
      throw new NotFoundException(
        `Equipment with ID ${dto.equipmentId} not found.`,
      );
    }

    if (job.scheduledDate) {
      const conflict = await this.assignmentRepository.hasConflict(
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
      companyId,
      equipment,
      job,
      user,
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
    const job = await this.jobRepository.findById(id, companyId, ['customer']);
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found.`);
    }

    // Validate all users and equipment exist
    for (const assignment of dto.assignments) {
      const user = await this.userRepository.findById(
        assignment.userId,
        companyId,
      );
      if (!user) {
        throw new NotFoundException(
          `User with ID ${assignment.userId} not found.`,
        );
      }

      const equipment = await this.equipmentRepository.findById(
        assignment.equipmentId,
        companyId,
      );
      if (!equipment) {
        throw new NotFoundException(
          `Equipment with ID ${assignment.equipmentId} not found.`,
        );
      }
    }

    // Check for conflicts if job is scheduled
    if (job.scheduledDate) {
      for (const assignment of dto.assignments) {
        const conflict = await this.assignmentRepository.hasConflict(
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
    await this.assignmentRepository.bulkCreate(dto.assignments, job, companyId);

    const updatedJob = await this.findOne(id, companyId);
    return updatedJob;
  }

  async removeAssignment(
    jobId: number,
    assignmentId: number,
    companyId: number,
  ): Promise<JobResponseDto> {
    const assignment = await this.assignmentRepository.findById(
      assignmentId,
      jobId,
      companyId,
    );

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

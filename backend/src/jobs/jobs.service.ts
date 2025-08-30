import {
  ConflictException,
  Injectable,
  NotFoundException,
  Inject,
  Optional,
} from '@nestjs/common';
import { JobResponseDto } from './dto/job-response.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { AssignJobDto } from './dto/assign-job.dto';
import { BulkAssignJobDto } from './dto/bulk-assign-job.dto';
import { ScheduleJobDto } from './dto/schedule-job.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

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

import { toJobResponseDto } from './jobs.mapper';
import { MetricsService } from '../metrics/metrics.service';

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
      customer,
      companyId,
    });
    const savedJob = await this.jobRepository.save(job);
    this.metrics?.incrementCounter('jobs_created_total', {
      route: 'jobs.create',
      companyId,
      status: 'success',
    });
    return toJobResponseDto(savedJob);
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
    const [jobs, total] = await this.jobRepository.findAll(
      pagination,
      companyId,
      {
        completed,
        customerId,
        startDate,
        endDate,
        workerId,
        equipmentId,
      },
    );

    return {
      items: jobs.map((job) => toJobResponseDto(job)),
      total,
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

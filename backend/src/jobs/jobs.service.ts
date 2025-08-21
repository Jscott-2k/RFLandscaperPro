import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
    companyId: number,
    createJobDto: CreateJobDto,
  ): Promise<JobResponseDto> {
    const { customerId, ...jobData } = createJobDto;
    const customer = await this.customerRepository.findOne({
      where: { id: customerId, company: { id: companyId } },
    });
    if (!customer) {
      throw new NotFoundException(
        `Customer with ID ${customerId} not found.`,
      );
    }
    const job = this.jobRepository.create({
      ...jobData,
      customer,
      company: { id: companyId } as any,
    });
    const savedJob = await this.jobRepository.save(job);
    return this.toJobResponseDto(savedJob);
  }

  async findAll(
    companyId: number,
    page = 1,
    limit = 10,
  ): Promise<{ items: JobResponseDto[]; total: number }> {
    const [jobs, total] = await this.jobRepository.findAndCount({
      where: { company: { id: companyId } },
      relations: ['customer', 'assignments', 'assignments.user', 'assignments.equipment'],
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: jobs.map((job) => this.toJobResponseDto(job)),
      total,
    };
  }

  async update(
    companyId: number,
    id: number,
    updateJobDto: UpdateJobDto,
  ): Promise<JobResponseDto> {
    const job = await this.jobRepository.findOne({
      where: { id, company: { id: companyId } },
      relations: ['customer', 'assignments', 'assignments.user', 'assignments.equipment'],
    });
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found.`);
    }
    const { customerId, ...updateData } = updateJobDto;
    if (customerId !== undefined) {
      const customer = await this.customerRepository.findOne({
        where: { id: customerId, company: { id: companyId } },
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

  async findOne(companyId: number, id: number): Promise<JobResponseDto> {
    const job = await this.jobRepository.findOne({
      where: { id, company: { id: companyId } },
      relations: ['customer', 'assignments', 'assignments.user', 'assignments.equipment'],
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found.`);
    }

    return this.toJobResponseDto(job);
  }

  async remove(companyId: number, id: number): Promise<void> {
    const job = await this.jobRepository.findOne({
      where: { id, company: { id: companyId } },
    });
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
      customer: {
        id: job.customer.id,
        name: job.customer.name,
        email: job.customer.email,
      },
      assignments: job.assignments?.map((assignment) => ({
        id: assignment.id,
        user: { id: assignment.user.id, username: assignment.user.username },
        equipment: { id: assignment.equipment.id, name: assignment.equipment.name },
      })),
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  private async checkResourceConflicts(
    companyId: number,
    date: Date,
    userId: number,
    equipmentId: number,
    jobId?: number,
  ): Promise<boolean> {
    const query = this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoin('assignment.job', 'job')
      .where('job.companyId = :companyId', { companyId })
      .andWhere('job.scheduledDate = :date', { date })
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
    companyId: number,
    id: number,
    scheduleJobDto: ScheduleJobDto,
  ): Promise<JobResponseDto> {
    const job = await this.jobRepository.findOne({
      where: { id, company: { id: companyId } },
      relations: ['customer', 'assignments', 'assignments.user', 'assignments.equipment'],
    });
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found.`);
    }

    for (const assignment of job.assignments || []) {
      const conflict = await this.checkResourceConflicts(
        companyId,
        scheduleJobDto.scheduledDate,
        assignment.user.id,
        assignment.equipment.id,
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
    companyId: number,
    id: number,
    dto: AssignJobDto,
  ): Promise<JobResponseDto> {
    const job = await this.jobRepository.findOne({
      where: { id, company: { id: companyId } },
      relations: ['customer'],
    });
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found.`);
    }

    const user = await this.userRepository.findOne({
      where: { id: dto.userId, company: { id: companyId } },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${dto.userId} not found.`);
    }

    const equipment = await this.equipmentRepository.findOne({
      where: { id: dto.equipmentId, company: { id: companyId } },
    });
    if (!equipment) {
      throw new NotFoundException(
        `Equipment with ID ${dto.equipmentId} not found.`,
      );
    }

    if (job.scheduledDate) {
      const conflict = await this.checkResourceConflicts(
        companyId,
        job.scheduledDate,
        dto.userId,
        dto.equipmentId,
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
    });
    await this.assignmentRepository.save(assignment);

    const updatedJob = await this.jobRepository.findOne({
      where: { id, company: { id: companyId } },
      relations: ['customer', 'assignments', 'assignments.user', 'assignments.equipment'],
    });
    return this.toJobResponseDto(updatedJob!);
  }

  async bulkAssign(
    companyId: number,
    id: number,
    dto: BulkAssignJobDto,
  ): Promise<JobResponseDto> {
    const job = await this.jobRepository.findOne({
      where: { id, company: { id: companyId } },
      relations: ['customer'],
    });
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found.`);
    }

    // Validate all users and equipment exist
    for (const assignment of dto.assignments) {
      const user = await this.userRepository.findOne({
        where: { id: assignment.userId, company: { id: companyId } },
      });
      if (!user) {
        throw new NotFoundException(`User with ID ${assignment.userId} not found.`);
      }

      const equipment = await this.equipmentRepository.findOne({
        where: { id: assignment.equipmentId, company: { id: companyId } },
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
          companyId,
          job.scheduledDate,
          assignment.userId,
          assignment.equipmentId,
        );
        if (conflict) {
          throw new ConflictException(
            `Resource conflict: user ${assignment.userId} or equipment ${assignment.equipmentId} is already assigned on this date.`,
          );
        }
      }
    }

    // Create all assignments
    const assignments = dto.assignments.map(assignmentData =>
      this.assignmentRepository.create({
        job,
        user: { id: assignmentData.userId } as User,
        equipment: { id: assignmentData.equipmentId } as Equipment,
      })
    );

    await this.assignmentRepository.save(assignments);

    const updatedJob = await this.jobRepository.findOne({
      where: { id, company: { id: companyId } },
      relations: ['customer', 'assignments', 'assignments.user', 'assignments.equipment'],
    });
    return this.toJobResponseDto(updatedJob!);
  }

  async removeAssignment(
    companyId: number,
    jobId: number,
    assignmentId: number,
  ): Promise<JobResponseDto> {
    const assignment = await this.assignmentRepository.findOne({
      where: {
        id: assignmentId,
        job: { id: jobId, company: { id: companyId } },
      },
      relations: ['job'],
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${assignmentId} not found for job ${jobId}.`);
    }

    await this.assignmentRepository.remove(assignment);

    const updatedJob = await this.jobRepository.findOne({
      where: { id: jobId, company: { id: companyId } },
      relations: ['customer', 'assignments', 'assignments.user', 'assignments.equipment'],
    });
    return this.toJobResponseDto(updatedJob!);
  }
}

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

  async create(createJobDto: CreateJobDto): Promise<JobResponseDto> {
    const { customerId, ...jobData } = createJobDto;
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });
    if (!customer) {
      throw new NotFoundException(
        `Customer with ID ${customerId} not found.`,
      );
    }
    const job = this.jobRepository.create({
      ...jobData,
      customer,
    });
    const savedJob = await this.jobRepository.save(job);
    return this.toJobResponseDto(savedJob);
  }

  async findAll(
    page = 1,
    limit = 10,
  ): Promise<{ items: JobResponseDto[]; total: number }> {
    const [jobs, total] = await this.jobRepository.findAndCount({
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
    id: number,
    updateJobDto: UpdateJobDto,
  ): Promise<JobResponseDto> {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: ['customer', 'assignments', 'assignments.user', 'assignments.equipment'],
    });
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found.`);
    }
    const { customerId, ...updateData } = updateJobDto;
    if (customerId !== undefined) {
      const customer = await this.customerRepository.findOne({
        where: { id: customerId },
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

  async findOne(id: number): Promise<JobResponseDto> {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: ['customer', 'assignments', 'assignments.user', 'assignments.equipment'],
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found.`);
    }

    return this.toJobResponseDto(job);
  }

  async remove(id: number): Promise<void> {
    const job = await this.jobRepository.findOne({ where: { id } });
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

  async schedule(
    id: number,
    scheduleJobDto: ScheduleJobDto,
  ): Promise<JobResponseDto> {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: ['customer', 'assignments', 'assignments.user', 'assignments.equipment'],
    });
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found.`);
    }

    for (const assignment of job.assignments || []) {
      const conflict = await this.assignmentRepository
        .createQueryBuilder('assignment')
        .leftJoin('assignment.job', 'job')
        .where('job.scheduledDate = :date', {
          date: scheduleJobDto.scheduledDate,
        })
        .andWhere('job.id != :jobId', { jobId: id })
        .andWhere(
          '(assignment.userId = :userId OR assignment.equipmentId = :equipmentId)',
          {
            userId: assignment.user.id,
            equipmentId: assignment.equipment.id,
          },
        )
        .getOne();
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

  async assign(id: number, dto: AssignJobDto): Promise<JobResponseDto> {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: ['customer'],
    });
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found.`);
    }

    const user = await this.userRepository.findOne({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${dto.userId} not found.`);
    }

    const equipment = await this.equipmentRepository.findOne({
      where: { id: dto.equipmentId },
    });
    if (!equipment) {
      throw new NotFoundException(
        `Equipment with ID ${dto.equipmentId} not found.`,
      );
    }

    if (job.scheduledDate) {
      const conflict = await this.assignmentRepository
        .createQueryBuilder('assignment')
        .leftJoin('assignment.job', 'job')
        .where('job.scheduledDate = :date', { date: job.scheduledDate })
        .andWhere(
          '(assignment.userId = :userId OR assignment.equipmentId = :equipmentId)',
          { userId: dto.userId, equipmentId: dto.equipmentId },
        )
        .getOne();
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
      where: { id },
      relations: ['customer', 'assignments', 'assignments.user', 'assignments.equipment'],
    });
    return this.toJobResponseDto(updatedJob!);
  }
}

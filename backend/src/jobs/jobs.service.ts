import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from './entities/job.entity';
import { JobResponseDto } from './dto/job-response.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) {}

  async create(createJobDto: CreateJobDto): Promise<JobResponseDto> {
    const { customerId, ...jobData } = createJobDto;
    const job = this.jobRepository.create({
      ...jobData,
      customer: { id: customerId },
    });
    const savedJob = await this.jobRepository.save(job);
    return this.toJobResponseDto(savedJob);
  }

  async findAll(): Promise<JobResponseDto[]> {
    const jobs = await this.jobRepository.find({
      relations: ['customer'],
    });

    return jobs.map((job) => this.toJobResponseDto(job));
  }

  async update(
    id: number,
    updateJobDto: UpdateJobDto,
  ): Promise<JobResponseDto> {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: ['customer'],
    });
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found.`);
    }
    const { customerId, ...updateData } = updateJobDto;
    if (customerId !== undefined) {
      job.customer = { id: customerId } as Job['customer'];
    }
    Object.assign(job, updateData);
    const updatedJob = await this.jobRepository.save(job);
    return this.toJobResponseDto(updatedJob);
  }

  async findOne(id: number): Promise<JobResponseDto> {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: ['customer'],
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
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

type UploadedFile = {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
};
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from './entities/job.entity';
import { Customer } from '../customers/entities/customer.entity';
import { JobImage } from './entities/job-image.entity';
import { JobResponseDto } from './dto/job-response.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(JobImage)
    private readonly imageRepository: Repository<JobImage>,
  ) {}

  async create(createJobDto: CreateJobDto): Promise<JobResponseDto> {
    const customer = await this.customerRepository.findOne({
      where: { id: createJobDto.customerId },
    });
    if (!customer) {
      throw new NotFoundException(
        `Customer with ID ${createJobDto.customerId} not found.`,
      );
    }
    const job = this.jobRepository.create({
      ...createJobDto,
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
      relations: ['customer'],
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
      relations: ['customer'],
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

  async addImage(jobId: number, file: UploadedFile): Promise<JobImage> {
    const job = await this.jobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found.`);
    }
    const image = this.imageRepository.create({
      job,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
    });
    return this.imageRepository.save(image);
  }

  async getImage(jobId: number, imageId: number): Promise<JobImage> {
    const image = await this.imageRepository.findOne({
      where: { id: imageId },
      relations: ['job'],
    });
    if (!image || image.job.id !== jobId) {
      throw new NotFoundException('Image not found for this job.');
    }
    return image;
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

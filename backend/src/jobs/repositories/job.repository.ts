import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../entities/job.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export const JOB_REPOSITORY = Symbol('JOB_REPOSITORY');

export interface IJobRepository {
  create(data: Partial<Job>): Job;
  save(job: Job): Promise<Job>;
  findAll(
    pagination: PaginationQueryDto,
    companyId: number,
    filters: {
      completed?: boolean;
      customerId?: number;
      startDate?: Date;
      endDate?: Date;
      workerId?: number;
      equipmentId?: number;
    },
  ): Promise<[Job[], number]>;
  findById(
    id: number,
    companyId: number,
    relations?: string[],
  ): Promise<Job | null>;
  remove(job: Job): Promise<void>;
}

@Injectable()
export class JobRepository implements IJobRepository {
  constructor(
    @InjectRepository(Job)
    private readonly repo: Repository<Job>,
  ) {}

  create(data: Partial<Job>): Job {
    return this.repo.create(data);
  }

  save(job: Job): Promise<Job> {
    return this.repo.save(job);
  }

  async findAll(
    pagination: PaginationQueryDto,
    companyId: number,
    filters: {
      completed?: boolean;
      customerId?: number;
      startDate?: Date;
      endDate?: Date;
      workerId?: number;
      equipmentId?: number;
    },
  ): Promise<[Job[], number]> {
    const { page = 1, limit = 10 } = pagination;
    const cappedLimit = Math.min(limit, 100);
    const queryBuilder = this.repo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.customer', 'customer')
      .leftJoinAndSelect('job.assignments', 'assignments')
      .leftJoinAndSelect('assignments.user', 'user')
      .leftJoinAndSelect('assignments.equipment', 'equipment')
      .where('job.companyId = :companyId', { companyId });

    const { completed, customerId, startDate, endDate, workerId, equipmentId } =
      filters;

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

    return queryBuilder
      .skip((page - 1) * cappedLimit)
      .take(cappedLimit)
      .orderBy('job.scheduledDate', 'ASC')
      .addOrderBy('job.createdAt', 'DESC')
      .getManyAndCount();
  }

  findById(
    id: number,
    companyId: number,
    relations: string[] = [],
  ): Promise<Job | null> {
    return this.repo.findOne({
      where: { id, companyId },
      relations,
    });
  }

  async remove(job: Job): Promise<void> {
    await this.repo.remove(job);
  }
}

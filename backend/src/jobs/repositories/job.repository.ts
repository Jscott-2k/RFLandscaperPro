import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../entities/job.entity';
import { Paginated, PaginationParams, paginate } from '../../common/pagination';

export const JOB_REPOSITORY = Symbol('JOB_REPOSITORY');

export interface IJobRepository {
  create(data: Partial<Job>): Job;
  save(job: Job): Promise<Job>;
  findAll(
    pagination: PaginationParams,
    companyId: number,
    filters: {
      completed?: boolean;
      customerId?: number;
      startDate?: Date;
      endDate?: Date;
      workerId?: number;
      equipmentId?: number;
    },
  ): Promise<Paginated<Job>>;
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
    pagination: PaginationParams,
    companyId: number,
    filters: {
      completed?: boolean;
      customerId?: number;
      startDate?: Date;
      endDate?: Date;
      workerId?: number;
      equipmentId?: number;
    },
  ): Promise<Paginated<Job>> {
    const { completed, customerId, startDate, endDate, workerId, equipmentId } =
      filters;

    return paginate(this.repo, pagination, 'job', (qb) => {
      qb.leftJoinAndSelect('job.customer', 'customer')
        .leftJoinAndSelect('job.assignments', 'assignments')
        .leftJoinAndSelect('assignments.user', 'user')
        .leftJoinAndSelect('assignments.equipment', 'equipment')
        .where('job.companyId = :companyId', { companyId });

      if (completed !== undefined) {
        qb.andWhere('job.completed = :completed', { completed });
      }

      if (customerId) {
        qb.andWhere('job.customer.id = :customerId', { customerId });
      }

      if (startDate) {
        qb.andWhere('job.scheduledDate >= :startDate', { startDate });
      }

      if (endDate) {
        qb.andWhere('job.scheduledDate <= :endDate', { endDate });
      }

      if (workerId) {
        qb.andWhere('user.id = :workerId', { workerId });
      }

      if (equipmentId) {
        qb.andWhere('equipment.id = :equipmentId', { equipmentId });
      }

      qb.orderBy('job.scheduledDate', 'ASC').addOrderBy(
        'job.createdAt',
        'DESC',
      );

      return qb;
    });
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

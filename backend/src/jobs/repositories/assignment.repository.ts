import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type Repository, type EntityManager } from 'typeorm';

import { type Equipment } from '../../equipment/entities/equipment.entity';
import { type User } from '../../users/user.entity';
import { Assignment } from '../entities/assignment.entity';
import { type Job } from '../entities/job.entity';

export const ASSIGNMENT_REPOSITORY = Symbol('ASSIGNMENT_REPOSITORY');

export type IAssignmentRepository = {
  bulkCreate(
    assignments: { userId: number; equipmentId: number }[],
    job: Job,
    companyId: number,
  ): Promise<void>;
  create(data: Partial<Assignment>): Assignment;
  findById(
    id: number,
    jobId: number,
    companyId: number,
  ): Promise<Assignment | null>;
  hasConflict(
    date: Date,
    userId: number,
    equipmentId: number,
    companyId: number,
    jobId?: number,
  ): Promise<boolean>;
  remove(assignment: Assignment): Promise<void>;
  save(assignment: Assignment): Promise<Assignment>;
}

@Injectable()
export class AssignmentRepository implements IAssignmentRepository {
  constructor(
    @InjectRepository(Assignment)
    private readonly repo: Repository<Assignment>,
  ) {}

  create(data: Partial<Assignment>): Assignment {
    return this.repo.create(data);
  }

  save(assignment: Assignment): Promise<Assignment> {
    return this.repo.save(assignment);
  }

  findById(
    id: number,
    jobId: number,
    companyId: number,
  ): Promise<Assignment | null> {
    return this.repo.findOne({
      relations: ['job'],
      where: { companyId, id, job: { id: jobId } },
    });
  }

  async remove(assignment: Assignment): Promise<void> {
    await this.repo.remove(assignment);
  }

  async hasConflict(
    date: Date,
    userId: number,
    equipmentId: number,
    companyId: number,
    jobId?: number,
  ): Promise<boolean> {
    const query = this.repo
      .createQueryBuilder('assignment')
      .leftJoin('assignment.job', 'job')
      .where('job.scheduledDate = :date', { date })
      .andWhere('assignment.companyId = :companyId', { companyId })
      .andWhere(
        '(assignment.userId = :userId OR assignment.equipmentId = :equipmentId)',
        { equipmentId, userId },
      );

    if (jobId !== undefined) {
      query.andWhere('job.id != :jobId', { jobId });
    }

    const conflict = await query.getOne();
    return Boolean(conflict);
  }

  async bulkCreate(
    assignments: { userId: number; equipmentId: number }[],
    job: Job,
    companyId: number,
  ): Promise<void> {
    await this.repo.manager.transaction(async (manager: EntityManager) => {
      const entities = assignments.map((data) =>
        manager.create(Assignment, {
          companyId,
          equipment: { id: data.equipmentId } as Equipment,
          job,
          user: { id: data.userId } as User,
        }),
      );
      await manager.save(entities);
    });
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Assignment } from '../entities/assignment.entity';
import { Job } from '../entities/job.entity';
import { User } from '../../users/user.entity';
import { Equipment } from '../../equipment/entities/equipment.entity';

export const ASSIGNMENT_REPOSITORY = Symbol('ASSIGNMENT_REPOSITORY');

export interface IAssignmentRepository {
  create(data: Partial<Assignment>): Assignment;
  save(assignment: Assignment): Promise<Assignment>;
  findById(
    id: number,
    jobId: number,
    companyId: number,
  ): Promise<Assignment | null>;
  remove(assignment: Assignment): Promise<void>;
  hasConflict(
    date: Date,
    userId: number,
    equipmentId: number,
    companyId: number,
    jobId?: number,
  ): Promise<boolean>;
  bulkCreate(
    assignments: { userId: number; equipmentId: number }[],
    job: Job,
    companyId: number,
  ): Promise<void>;
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
      where: { id, companyId, job: { id: jobId } },
      relations: ['job'],
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
        { userId, equipmentId },
      );

    if (jobId !== undefined) {
      query.andWhere('job.id != :jobId', { jobId });
    }

    const conflict = await query.getOne();
    return !!conflict;
  }

  async bulkCreate(
    assignments: { userId: number; equipmentId: number }[],
    job: Job,
    companyId: number,
  ): Promise<void> {
    await this.repo.manager.transaction(async (manager: EntityManager) => {
      const entities = assignments.map((data) =>
        manager.create(Assignment, {
          job,
          user: { id: data.userId } as User,
          equipment: { id: data.equipmentId } as Equipment,
          companyId,
        }),
      );
      await manager.save(entities);
    });
  }
}

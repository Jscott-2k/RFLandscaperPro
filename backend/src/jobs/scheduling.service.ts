import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment } from './entities/assignment.entity';

@Injectable()
export class SchedulingService {
  constructor(
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
  ) {}

  async checkResourceConflicts(
    date: Date,
    userId: number,
    equipmentId: number,
    companyId: number,
    jobId?: number,
  ): Promise<boolean> {
    const query = this.assignmentRepository
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
}

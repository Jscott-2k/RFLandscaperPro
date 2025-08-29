import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SelectQueryBuilder } from 'typeorm';
import { SchedulingService } from './scheduling.service';
import { Assignment } from './entities/assignment.entity';

describe('SchedulingService', () => {
  let service: SchedulingService;
  let repo: { createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    repo = { createQueryBuilder: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulingService,
        { provide: getRepositoryToken(Assignment), useValue: repo },
      ],
    }).compile();

    service = module.get<SchedulingService>(SchedulingService);
  });

  it('should detect conflicts', async () => {
    const qb: Record<string, jest.Mock> = {
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({ id: 1 }),
    };
    repo.createQueryBuilder.mockReturnValue(
      qb as unknown as SelectQueryBuilder<Assignment>,
    );

    const result = await service.checkResourceConflicts(
      new Date(),
      1,
      2,
      3,
      4,
    );

    expect(qb.leftJoin).toHaveBeenCalledWith('assignment.job', 'job');
    expect(qb.andWhere).toHaveBeenCalledWith(
      '(assignment.userId = :userId OR assignment.equipmentId = :equipmentId)',
      { userId: 1, equipmentId: 2 },
    );
    expect(result).toBe(true);
  });
});

import { paginate } from './pagination';
import { Repository, SelectQueryBuilder } from 'typeorm';

describe('paginate', () => {
  let repo: jest.Mocked<Repository<any>>;
  let qb: Record<string, jest.Mock>;

  beforeEach(() => {
    qb = {
      andWhere: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };

    repo = {
      createQueryBuilder: jest
        .fn()
        .mockReturnValue(qb as unknown as SelectQueryBuilder<any>),
    } as unknown as jest.Mocked<Repository<any>>;
  });

  it('caps limit at 100', async () => {
    await paginate(repo, { page: 1, limit: 1000 }, 'entity');
    expect(qb.take).toHaveBeenCalledWith(100);
  });

  it('applies provided filters', async () => {
    const filter = (qb: SelectQueryBuilder<any>) =>
      qb.andWhere('entity.active = :active', { active: true });

    await paginate(repo, { page: 1, limit: 10 }, 'entity', filter);
    expect(qb.andWhere).toHaveBeenCalledWith('entity.active = :active', {
      active: true,
    });
  });
});

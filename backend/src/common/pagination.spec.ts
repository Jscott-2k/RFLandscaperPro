import { type Repository, type SelectQueryBuilder } from 'typeorm';

import { paginate } from './pagination';

describe('paginate', () => {
  let repo: jest.Mocked<Repository<any>>;
  let qb: Record<string, jest.Mock>;

  beforeEach(() => {
    qb = {
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
    };

    repo = {
      createQueryBuilder: jest
        .fn()
        .mockReturnValue(qb as unknown as SelectQueryBuilder<any>),
    } as unknown as jest.Mocked<Repository<any>>;
  });

  it('caps limit at 100', async () => {
    await paginate(repo, { limit: 1000 }, 'entity');
    expect(qb.take).toHaveBeenCalledWith(101);
  });

  it('applies provided filters', async () => {
    const filter = (qb: SelectQueryBuilder<any>) =>
      qb.andWhere('entity.active = :active', { active: true });

    await paginate(repo, { limit: 10 }, 'entity', filter);
    expect(qb.andWhere).toHaveBeenCalledWith('entity.active = :active', {
      active: true,
    });
  });
});

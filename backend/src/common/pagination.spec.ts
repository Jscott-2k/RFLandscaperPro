import { type Repository, type SelectQueryBuilder } from 'typeorm';

import { paginate } from './pagination';

describe('paginate', () => {
  let repo: jest.Mocked<Repository<unknown>>;
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
        .mockReturnValue(qb as unknown as SelectQueryBuilder<unknown>),
    } as unknown as jest.Mocked<Repository<unknown>>;
  });

  it('caps limit at 100', async () => {
    await paginate(repo, { limit: 1000 }, 'entity');
    expect(qb.take).toHaveBeenCalledWith(101);
  });

  it('applies provided filters', async () => {
    const filter = (
      qb: SelectQueryBuilder<unknown>,
    ): SelectQueryBuilder<unknown> =>
      qb.andWhere('entity.active = :active', { active: true });

    await paginate(repo, { limit: 10 }, 'entity', filter);
    expect(qb.andWhere).toHaveBeenCalledWith('entity.active = :active', {
      active: true,
    });
  });
});

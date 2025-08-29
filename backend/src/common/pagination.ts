import { Repository, SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { PaginationQueryDto } from './dto/pagination-query.dto';

export type QueryBuilderCustomizer<T extends ObjectLiteral> = (
  qb: SelectQueryBuilder<T>,
) => SelectQueryBuilder<T>;

/**
 * Applies pagination to a repository with optional query customizations.
 * Caps the limit at 100 items to prevent excessive queries.
 */
export async function paginate<T extends ObjectLiteral>(
  repository: Repository<T>,
  pagination: PaginationQueryDto,
  alias: string,
  customizeQuery?: QueryBuilderCustomizer<T>,
): Promise<{ items: T[]; total: number }> {
  const { page = 1, limit = 10 } = pagination;
  const cappedLimit = Math.min(limit, 100);

  let qb = repository.createQueryBuilder(alias);
  if (customizeQuery) {
    qb = customizeQuery(qb);
  }

  const [items, total] = await qb
    .skip((page - 1) * cappedLimit)
    .take(cappedLimit)
    .getManyAndCount();

  return { items, total };
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { type Repository, type SelectQueryBuilder, type ObjectLiteral } from 'typeorm';

export class PaginationParams {
  @ApiPropertyOptional({ default: 10, maximum: 100 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Cursor for pagination' })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  cursor?: number;
}

export type Paginated<T> = {
  items: T[];
  nextCursor: number | null;
}

export type QueryBuilderCustomizer<T extends ObjectLiteral> = (
  qb: SelectQueryBuilder<T>,
) => SelectQueryBuilder<T>;

/**
 * Applies cursor-based pagination to a repository with optional query customizations.
 * Results are ordered deterministically by the entity's primary key.
 */
export async function paginate<T extends ObjectLiteral & { id: number }>(
  repository: Repository<T>,
  pagination: PaginationParams,
  alias: string,
  customizeQuery?: QueryBuilderCustomizer<T>,
): Promise<Paginated<T>> {
  const { cursor, limit = 10 } = pagination;
  const cappedLimit = Math.min(limit, 100);

  let qb = repository.createQueryBuilder(alias);
  if (customizeQuery) {
    qb = customizeQuery(qb);
  }

  if (cursor !== undefined) {
    qb = qb.andWhere(`${alias}.id > :cursor`, { cursor });
  }

  const items = await qb
    .orderBy(`${alias}.id`, 'ASC')
    .take(cappedLimit + 1)
    .getMany();

  const hasNext = items.length > cappedLimit;
  const trimmed = hasNext ? items.slice(0, cappedLimit) : items;
  const nextCursor = hasNext ? trimmed[trimmed.length - 1].id : null;

  return { items: trimmed, nextCursor };
}

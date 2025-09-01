import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type Repository, type FindOneOptions, type FindOptionsWhere } from 'typeorm';

import { RefreshToken } from '../refresh-token.entity';

export type RefreshTokenRepository = {
  create(data: Partial<RefreshToken>): RefreshToken;
  findOne(options: FindOneOptions<RefreshToken>): Promise<RefreshToken | null>;
  save(token: RefreshToken): Promise<RefreshToken>;
  update(
    criteria: FindOptionsWhere<RefreshToken>,
    partialEntity: Partial<RefreshToken>,
  ): Promise<void>;
}

export const REFRESH_TOKEN_REPOSITORY = Symbol('RefreshTokenRepository');

@Injectable()
export class TypeOrmRefreshTokenRepository implements RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repository: Repository<RefreshToken>,
  ) {}

  findOne(options: FindOneOptions<RefreshToken>): Promise<RefreshToken | null> {
    return this.repository.findOne(options);
  }

  create(data: Partial<RefreshToken>): RefreshToken {
    return this.repository.create(data);
  }

  save(token: RefreshToken): Promise<RefreshToken> {
    return this.repository.save(token);
  }

  async update(
    criteria: FindOptionsWhere<RefreshToken>,
    partialEntity: Partial<RefreshToken>,
  ): Promise<void> {
    await this.repository.update(criteria, partialEntity);
  }
}

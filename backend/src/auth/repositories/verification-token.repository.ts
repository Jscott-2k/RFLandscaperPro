import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions, FindOptionsWhere } from 'typeorm';
import { VerificationToken } from '../verification-token.entity';

export interface VerificationTokenRepository {
  findOne(
    options: FindOneOptions<VerificationToken>,
  ): Promise<VerificationToken | null>;
  create(data: Partial<VerificationToken>): VerificationToken;
  save(entity: VerificationToken): Promise<VerificationToken>;
  delete(criteria: FindOptionsWhere<VerificationToken>): Promise<void>;
}

export const VERIFICATION_TOKEN_REPOSITORY = Symbol(
  'VerificationTokenRepository',
);

@Injectable()
export class TypeOrmVerificationTokenRepository
  implements VerificationTokenRepository
{
  constructor(
    @InjectRepository(VerificationToken)
    private readonly repository: Repository<VerificationToken>,
  ) {}

  findOne(
    options: FindOneOptions<VerificationToken>,
  ): Promise<VerificationToken | null> {
    return this.repository.findOne(options);
  }

  create(data: Partial<VerificationToken>): VerificationToken {
    return this.repository.create(data);
  }

  save(entity: VerificationToken): Promise<VerificationToken> {
    return this.repository.save(entity);
  }

  async delete(criteria: FindOptionsWhere<VerificationToken>): Promise<void> {
    await this.repository.delete(criteria);
  }
}

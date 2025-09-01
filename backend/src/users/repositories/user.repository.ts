import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type Repository } from 'typeorm';

import { User } from '../user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export type IUserRepository = {
  findById(id: number, companyId: number): Promise<User | null>;
}

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  findById(id: number, companyId: number): Promise<User | null> {
    return this.repo.findOne({ where: { companyId, id } });
  }
}

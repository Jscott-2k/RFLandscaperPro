import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { password, ...rest } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({ ...rest, password: hashedPassword });
    return this.usersRepository.save(user);
  }
}

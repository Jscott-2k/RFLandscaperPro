import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, QueryFailedError, Repository } from 'typeorm';
import * as crypto from 'crypto';

import { EmailService } from '../common/email.service';

import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

const UNIQUE_VIOLATION = '23505';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly emailService: EmailService,
  ) {}

  findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);

    try {
      return await this.usersRepository.save(user);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const { code } = error.driverError as { code?: string };
        if (code === UNIQUE_VIOLATION) {
          throw new ConflictException('Username already exists');
        }
      }
      throw error;
    }
  }

  async requestPasswordReset(username: string): Promise<void> {
    const user = await this.findByUsername(username);
    if (!user) {
      return;
    }
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await this.usersRepository.save(user);
    this.emailService.sendPasswordResetEmail(user.username, token);
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.usersRepository.findOne({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: MoreThan(new Date()),
      },
    });
    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }
    user.password = password;
    user.hashPassword();
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await this.usersRepository.save(user);
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, MoreThan, Repository } from 'typeorm';
import * as crypto from 'crypto';

import { EmailService } from '../common/email';
import { passwordResetMail } from '../common/email/templates';

import { User, UserRole } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { validatePasswordStrength } from '../auth/password.util';
import { UserCreationService } from './user-creation.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly emailService: EmailService,
    private readonly userCreationService: UserCreationService,
  ) {}

  findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  findById(id: number, companyId?: number): Promise<User | null> {
    const where: FindOptionsWhere<User> = { id };
    if (companyId !== undefined) {
      where.companyId = companyId;
    }
    return this.usersRepository.findOne({
      where,
      relations: ['company'],
    });
  }

  findAll(companyId?: number): Promise<User[]> {
    const where: FindOptionsWhere<User> | undefined =
      companyId !== undefined ? { companyId } : undefined;
    return this.usersRepository.find({ where });
  }

  async markEmailVerified(userId: number): Promise<void> {
    await this.usersRepository.update(userId, { isVerified: true });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    return this.userCreationService.createUser(createUserDto);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) {
      return;
    }
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await this.usersRepository.save(user);
    await this.emailService.send(passwordResetMail(user.email.value, token));
  }

  async resetPassword(token: string, password: string): Promise<User> {
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
    validatePasswordStrength(password);
    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await this.usersRepository.save(user);
    return user;
  }

  async updateProfile(
    id: number,
    dto: UpdateUserDto,
    companyId?: number,
  ): Promise<User> {
    const user = await this.findById(id, companyId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.username !== undefined) {
      user.username = dto.username;
    }

    if (dto.password !== undefined) {
      validatePasswordStrength(dto.password);
      user.password = dto.password;
    }

    if (dto.email !== undefined) {
      user.email = dto.email;
    }

    if (dto.firstName !== undefined) {
      user.firstName = dto.firstName;
    }

    if (dto.lastName !== undefined) {
      user.lastName = dto.lastName;
    }

    if (dto.phone !== undefined) {
      user.phone = dto.phone;
    }

    return this.usersRepository.save(user);
  }

  async update(
    id: number,
    dto: UpdateUserDto,
    companyId?: number,
  ): Promise<User> {
    return this.updateProfile(id, dto, companyId);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.usersRepository.remove(user);
  }

  async updateRole(id: number, role: UserRole): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.role = role;
    return this.usersRepository.save(user);
  }
}

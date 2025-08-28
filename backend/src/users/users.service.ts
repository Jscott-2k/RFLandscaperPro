import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, QueryFailedError, Repository } from 'typeorm';
import * as crypto from 'crypto';

import { EmailService } from '../common/email.service';

import { User, UserRole } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { validatePasswordStrength } from '../auth/password.util';
import { Customer } from '../customers/entities/customer.entity';
import { Company } from '../companies/entities/company.entity';

const UNIQUE_VIOLATION = '23505';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly emailService: EmailService,
  ) {}

  findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { company, ...userData } = createUserDto;
    const user = this.usersRepository.create(userData);

    try {
      const savedUser = await this.usersRepository.save(user);

      if (savedUser.role === UserRole.Customer) {
        const customer = this.customerRepository.create({
          name: savedUser.username,
          email: savedUser.email,
          userId: savedUser.id,
        });
        await this.customerRepository.save(customer);
      } else if (
        savedUser.role === UserRole.Owner ||
        savedUser.role === UserRole.Worker
      ) {
        if (!company) {
          throw new BadRequestException(
            'Company information is required for owner and worker accounts',
          );
        }

        let existing = await this.companyRepository.findOne({
          where: { name: company.name },
        });

        if (!existing) {
          existing = this.companyRepository.create({
            ...company,
            ownerId: savedUser.role === UserRole.Owner ? savedUser.id : undefined,
          });
          existing = await this.companyRepository.save(existing);
        }

        savedUser.companyId = existing.id;
        await this.usersRepository.save(savedUser);
      }

      return savedUser;
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const { code } = error.driverError as { code?: string };
        if (code === UNIQUE_VIOLATION) {
          throw new ConflictException('Username or email already exists');
        }
      }
      throw error;
    }
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
    await this.emailService.sendPasswordResetEmail(user.email, token);
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
    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await this.usersRepository.save(user);
    return user;
  }

  async updateProfile(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
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

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    return this.updateProfile(id, dto);
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

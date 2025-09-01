import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type Repository, QueryFailedError } from 'typeorm';

import { CompanyOnboardingService } from './company-onboarding.service';
import { CustomerRegistrationService } from './customer-registration.service';
import { type CreateUserDto } from './dto/create-user.dto';
import { User, UserRole } from './user.entity';

const UNIQUE_VIOLATION = '23505';

@Injectable()
export class UserCreationService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly customerRegistrationService: CustomerRegistrationService,
    private readonly companyOnboardingService: CompanyOnboardingService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { company, ...userData } = createUserDto;
    try {
      return await this.usersRepository.manager.transaction(async (manager) => {
        const userRepo = manager.getRepository(User);
        const user = userRepo.create(userData);
        const savedUser = await userRepo.save(user);

        if (savedUser.role === UserRole.Customer) {
          await this.customerRegistrationService.register(savedUser, manager);
        } else if (
          savedUser.role === UserRole.CompanyOwner ||
          savedUser.role === UserRole.Worker
        ) {
          await this.companyOnboardingService.onboard(
            savedUser,
            company,
            manager,
          );
        }

        return savedUser;
      });
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
}

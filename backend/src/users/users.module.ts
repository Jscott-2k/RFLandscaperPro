import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CompanyUser } from '../companies/entities/company-user.entity';
import { Company } from '../companies/entities/company.entity';
import { CompanyOnboardingService } from './company-onboarding.service';
import { CustomerRegistrationService } from './customer-registration.service';
import { MeController } from './me.controller';
import {
  USER_REPOSITORY,
  UserRepository,
} from './repositories/user.repository';
import { UserCreationService } from './user-creation.service';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const userRepositoryProvider = {
  provide: USER_REPOSITORY,
  useClass: UserRepository,
};

@Module({
  controllers: [UsersController, MeController],
  exports: [UsersService, USER_REPOSITORY, UserCreationService],
  imports: [TypeOrmModule.forFeature([User, CompanyUser, Company])],
  providers: [
    UsersService,
    UserCreationService,
    CustomerRegistrationService,
    CompanyOnboardingService,
    userRepositoryProvider,
  ],
})
export class UsersModule {}

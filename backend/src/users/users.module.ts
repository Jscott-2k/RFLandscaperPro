import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { CompanyUser } from '../companies/entities/company-user.entity';
import { Company } from '../companies/entities/company.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MeController } from './me.controller';
import { UserCreationService } from './user-creation.service';
import { CustomerRegistrationService } from './customer-registration.service';
import { CompanyOnboardingService } from './company-onboarding.service';
import {
  USER_REPOSITORY,
  UserRepository,
} from './repositories/user.repository';
import { EmailModule } from '../common/email';

const userRepositoryProvider = {
  provide: USER_REPOSITORY,
  useClass: UserRepository,
};

@Module({
  imports: [
    TypeOrmModule.forFeature([User, CompanyUser, Company]),
    EmailModule,
  ],
  providers: [
    UsersService,
    UserCreationService,
    CustomerRegistrationService,
    CompanyOnboardingService,
    userRepositoryProvider,
  ],
  controllers: [UsersController, MeController],
  exports: [UsersService, userRepositoryProvider, UserCreationService],
})
export class UsersModule {}

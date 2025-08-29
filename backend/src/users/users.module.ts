import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { EmailService } from '../common/email.service';
import { UserCreationService } from './user-creation.service';
import { CustomerRegistrationService } from './customer-registration.service';
import { CompanyOnboardingService } from './company-onboarding.service';
import {
  USER_REPOSITORY,
  UserRepository,
} from './repositories/user.repository';

const userRepositoryProvider = {
  provide: USER_REPOSITORY,
  useClass: UserRepository,
};

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [
    UsersService,
    EmailService,
    UserCreationService,
    CustomerRegistrationService,
    CompanyOnboardingService,
    userRepositoryProvider,
  ],
  controllers: [UsersController],
  exports: [UsersService, userRepositoryProvider],
})
export class UsersModule {}

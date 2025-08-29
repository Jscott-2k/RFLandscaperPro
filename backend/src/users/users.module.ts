import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Company } from '../companies/entities/company.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { EmailService } from '../common/email.service';
import {
  USER_REPOSITORY,
  UserRepository,
} from './repositories/user.repository';

const userRepositoryProvider = {
  provide: USER_REPOSITORY,
  useClass: UserRepository,
};

@Module({
  imports: [TypeOrmModule.forFeature([User, Customer, Company])],
  providers: [UsersService, EmailService, userRepositoryProvider],
  controllers: [UsersController],
  exports: [UsersService, userRepositoryProvider],
})
export class UsersModule {}

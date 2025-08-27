import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Customer } from '../customers/entities/customer.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { EmailService } from '../common/email.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Customer])],
  providers: [UsersService, EmailService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { CompanyUser } from './entities/company-user.entity';
import { Invitation } from './entities/invitation.entity';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';
import { InvitationsService } from './invitations.service';
import { EmailService } from '../common/email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, User, CompanyUser, Invitation]),
    UsersModule,
  ],
  providers: [CompaniesService, InvitationsService, EmailService],
  controllers: [CompaniesController],
  exports: [CompaniesService, InvitationsService],
})
export class CompaniesModule {}

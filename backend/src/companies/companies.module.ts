import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { CompanyUser } from './entities/company-user.entity';
import { Company } from './entities/company.entity';
import { Invitation } from './entities/invitation.entity';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

@Module({
  controllers: [CompaniesController, InvitationsController, MembersController],
  exports: [CompaniesService, InvitationsService, MembersService],
  imports: [
    TypeOrmModule.forFeature([Company, User, CompanyUser, Invitation]),
    UsersModule,
    AuthModule,
  ],
  providers: [CompaniesService, InvitationsService, MembersService],
})
export class CompaniesModule {}

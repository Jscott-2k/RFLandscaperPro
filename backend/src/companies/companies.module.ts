import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { CompanyUser } from './entities/company-user.entity';
import { Invitation } from './entities/invitation.entity';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { InvitationsController } from './invitations.controller';
import { MembersController } from './members.controller';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';
import { InvitationsService } from './invitations.service';
import { AuthModule } from '../auth/auth.module';
import { MembersService } from './members.service';
import { EmailModule } from '../common/email';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, User, CompanyUser, Invitation]),
    UsersModule,
    AuthModule,
    EmailModule,
  ],
  providers: [
    CompaniesService,
    InvitationsService,
    MembersService,
  ],
  controllers: [CompaniesController, InvitationsController, MembersController],
  exports: [CompaniesService, InvitationsService, MembersService],
})
export class CompaniesModule {}

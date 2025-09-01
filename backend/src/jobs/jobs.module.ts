import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CustomersModule } from '../customers/customers.module';
import { EquipmentModule } from '../equipment/equipment.module';
import { UsersModule } from '../users/users.module';
import { Assignment } from './entities/assignment.entity';
import { Job } from './entities/job.entity';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import {
  AssignmentRepository,
  ASSIGNMENT_REPOSITORY,
} from './repositories/assignment.repository';
import { JobRepository, JOB_REPOSITORY } from './repositories/job.repository';

const jobRepositoryProvider = {
  provide: JOB_REPOSITORY,
  useClass: JobRepository,
};

const assignmentRepositoryProvider = {
  provide: ASSIGNMENT_REPOSITORY,
  useClass: AssignmentRepository,
};

@Module({
  controllers: [JobsController],
  exports: [JobsService],
  imports: [
    TypeOrmModule.forFeature([Job, Assignment]),
    CustomersModule,
    UsersModule,
    EquipmentModule,
  ],
  providers: [JobsService, jobRepositoryProvider, assignmentRepositoryProvider],
})
export class JobsModule {}

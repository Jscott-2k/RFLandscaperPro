import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { Job } from './entities/job.entity';
import { Assignment } from './entities/assignment.entity';
import { CustomersModule } from '../customers/customers.module';
import { UsersModule } from '../users/users.module';
import { EquipmentModule } from '../equipment/equipment.module';
import {
  JobRepository,
  JOB_REPOSITORY,
} from './repositories/job.repository';
import {
  AssignmentRepository,
  ASSIGNMENT_REPOSITORY,
} from './repositories/assignment.repository';

const jobRepositoryProvider = {
  provide: JOB_REPOSITORY,
  useClass: JobRepository,
};

const assignmentRepositoryProvider = {
  provide: ASSIGNMENT_REPOSITORY,
  useClass: AssignmentRepository,
};

@Module({
  imports: [
    TypeOrmModule.forFeature([Job, Assignment]),
    CustomersModule,
    UsersModule,
    EquipmentModule,
  ],
  controllers: [JobsController],
  providers: [JobsService, jobRepositoryProvider, assignmentRepositoryProvider],
  exports: [JobsService],
})
export class JobsModule {}

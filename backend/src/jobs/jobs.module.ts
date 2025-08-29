import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { Job } from './entities/job.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Assignment } from './entities/assignment.entity';
import { User } from '../users/user.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
import { SchedulingService } from './scheduling.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job, Customer, Assignment, User, Equipment]),
  ],
  controllers: [JobsController],
  providers: [JobsService, SchedulingService],
  exports: [JobsService, SchedulingService],
})
export class JobsModule {}

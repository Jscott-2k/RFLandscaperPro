import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { Job } from './entities/job.entity';
import { Customer } from '../customers/entities/customer.entity';
import {
  makeCounterProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';

@Module({
  imports: [TypeOrmModule.forFeature([Job, Customer])],
  controllers: [JobsController],
  providers: [
    JobsService,
    makeCounterProvider({
      name: 'jobs_created_total',
      help: 'Total number of jobs created',
    }),
    makeHistogramProvider({
      name: 'jobs_creation_duration_seconds',
      help: 'Duration of job creation in seconds',
    }),
  ],
  exports: [JobsService],
})
export class JobsModule {}

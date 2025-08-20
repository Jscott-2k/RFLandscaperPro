import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { Job } from './entities/job.entity';
import { Customer } from '../customers/entities/customer.entity';
import { NotificationService } from '../common/notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([Job, Customer]), ScheduleModule],
  controllers: [JobsController],
  providers: [JobsService, NotificationService],
  exports: [JobsService],
})
export class JobsModule {}

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Customer } from '../customers/entities/customer.entity';
import { Job } from '../jobs/entities/job.entity';
import { ContractScheduler } from './contract-scheduler.service';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { Contract } from './entities/contract.entity';

@Module({
  controllers: [ContractsController],
  exports: [ContractsService],
  imports: [
    TypeOrmModule.forFeature([Contract, Customer, Job]),
    ScheduleModule,
  ],
  providers: [ContractsService, ContractScheduler],
})
export class ContractsModule {}

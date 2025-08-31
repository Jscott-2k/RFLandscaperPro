import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { Contract } from './entities/contract.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Job } from '../jobs/entities/job.entity';
import { ContractScheduler } from './contract-scheduler.service';

@Module({
  imports: [TypeOrmModule.forFeature([Contract, Customer, Job]), ScheduleModule],
  controllers: [ContractsController],
  providers: [ContractsService, ContractScheduler],
  exports: [ContractsService],
})
export class ContractsModule {}

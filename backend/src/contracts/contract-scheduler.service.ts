import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ContractsService } from './contracts.service';

@Injectable()
export class ContractScheduler {
  constructor(private readonly contractsService: ContractsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron(): Promise<void> {
    await this.contractsService.generateUpcomingJobs();
  }
}

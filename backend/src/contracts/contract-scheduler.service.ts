import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ContractsService } from './contracts.service';

@Injectable()
export class ContractScheduler {
  constructor(private readonly contractsService: ContractsService) {}

  @Cron('0 0 * * *')
  async handleCron(): Promise<void> {
    await this.contractsService.generateUpcomingJobs();
  }
}

import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type Repository } from 'typeorm';

import { Customer } from '../customers/entities/customer.entity';
import { Job } from '../jobs/entities/job.entity';
import { type MetricsService } from '../metrics/metrics.service';
import { toContractResponseDto } from './contracts.mapper';
import { type ContractResponseDto } from './dto/contract-response.dto';
import { type CreateContractDto } from './dto/create-contract.dto';
import { type UpdateContractDto } from './dto/update-contract.dto';
import { Contract, ContractFrequency } from './entities/contract.entity';

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @Optional() private readonly metrics?: MetricsService,
  ) {}

  async create(
    dto: CreateContractDto,
    companyId: number,
  ): Promise<ContractResponseDto> {
    const customer = await this.customerRepository.findOne({
      where: { companyId, id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException(
        `Customer with ID ${dto.customerId} not found.`,
      );
    }
    const contract = this.contractRepository.create({
      companyId,
      customer,
      endDate: dto.endDate,
      frequency: dto.frequency,
      jobTemplate: dto.jobTemplate,
      startDate: dto.startDate,
      totalOccurrences: dto.totalOccurrences,
    });
    const saved = await this.contractRepository.save(contract);
    await this.generateJobsForContract(saved);
    this.metrics?.incrementCounter('contracts_active_total', {
      companyId,
      route: 'contracts.create',
      status: 'active',
    });
    return toContractResponseDto(saved);
  }

  async findAll(companyId: number): Promise<ContractResponseDto[]> {
    const contracts = await this.contractRepository.find({
      relations: ['customer'],
      where: { companyId },
    });
    return contracts.map((c) => toContractResponseDto(c));
  }

  async update(
    id: number,
    dto: UpdateContractDto,
    companyId: number,
  ): Promise<ContractResponseDto> {
    const contract = await this.contractRepository.findOne({
      relations: ['customer'],
      where: { companyId, id },
    });
    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found.`);
    }
    if (dto.customerId !== undefined) {
      const customer = await this.customerRepository.findOne({
        where: { companyId, id: dto.customerId },
      });
      if (!customer) {
        throw new NotFoundException(
          `Customer with ID ${dto.customerId} not found.`,
        );
      }
      contract.customer = customer;
    }
    Object.assign(contract, {
      endDate: dto.endDate ?? contract.endDate,
      frequency: dto.frequency ?? contract.frequency,
      jobTemplate: dto.jobTemplate ?? contract.jobTemplate,
      startDate: dto.startDate ?? contract.startDate,
      totalOccurrences: dto.totalOccurrences ?? contract.totalOccurrences,
    });
    const saved = await this.contractRepository.save(contract);
    await this.generateJobsForContract(saved);
    return toContractResponseDto(saved);
  }

  async cancel(id: number, companyId: number): Promise<void> {
    const contract = await this.contractRepository.findOne({
      where: { companyId, id },
    });
    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found.`);
    }
    contract.active = false;
    await this.contractRepository.save(contract);
    this.metrics?.incrementCounter('contracts_expired_total', {
      companyId,
      route: 'contracts.cancel',
      status: 'expired',
    });
  }

  async generateJobsForContract(contract: Contract): Promise<void> {
    if (!contract.active) {return;}
    const now = new Date();
    let nextDate = contract.lastGeneratedDate
      ? this.addFrequency(contract.lastGeneratedDate, contract.frequency)
      : new Date(contract.startDate);
    while (
      nextDate <= now &&
      (!contract.endDate || nextDate <= contract.endDate) &&
      (contract.totalOccurrences === undefined ||
        contract.occurrencesGenerated < contract.totalOccurrences)
    ) {
      const job = this.jobRepository.create({
        companyId: contract.companyId,
        contract: { id: contract.id } as Contract,
        customer: contract.customer,
        description: contract.jobTemplate.description,
        estimatedHours: contract.jobTemplate.estimatedHours,
        notes: contract.jobTemplate.notes,
        scheduledDate: nextDate,
        title: contract.jobTemplate.title,
      });
      await this.jobRepository.save(job);
      contract.lastGeneratedDate = nextDate;
      contract.occurrencesGenerated += 1;
      nextDate = this.addFrequency(nextDate, contract.frequency);
    }
    await this.contractRepository.save(contract);
  }

  async generateUpcomingJobs(): Promise<void> {
    const contracts = await this.contractRepository.find({
      relations: ['customer'],
      where: { active: true },
    });
    for (const contract of contracts) {
      await this.generateJobsForContract(contract);
    }
  }

  private addFrequency(date: Date, frequency: ContractFrequency): Date {
    const result = new Date(date);
    switch (frequency) {
      case ContractFrequency.WEEKLY:
        result.setDate(result.getDate() + 7);
        break;
      case ContractFrequency.BIWEEKLY:
        result.setDate(result.getDate() + 14);
        break;
      case ContractFrequency.MONTHLY:
        result.setMonth(result.getMonth() + 1);
        break;
      case ContractFrequency.BIMONTHLY:
        result.setMonth(result.getMonth() + 2);
        break;
    }
    return result;
  }
}

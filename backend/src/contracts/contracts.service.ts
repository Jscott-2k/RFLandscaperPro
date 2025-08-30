import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract, ContractFrequency } from './entities/contract.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Job } from '../jobs/entities/job.entity';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { ContractResponseDto } from './dto/contract-response.dto';
import { toContractResponseDto } from './contracts.mapper';
import { MetricsService } from '../metrics/metrics.service';

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
      where: { id: dto.customerId, companyId },
    });
    if (!customer) {
      throw new NotFoundException(
        `Customer with ID ${dto.customerId} not found.`,
      );
    }
    const contract = this.contractRepository.create({
      customer,
      companyId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      frequency: dto.frequency,
      totalOccurrences: dto.totalOccurrences,
      jobTemplate: dto.jobTemplate,
    });
    const saved = await this.contractRepository.save(contract);
    await this.generateJobsForContract(saved);
    this.metrics?.incrementCounter('contracts_active_total', {
      route: 'contracts.create',
      companyId,
      status: 'active',
    });
    return toContractResponseDto(saved);
  }

  async findAll(companyId: number): Promise<ContractResponseDto[]> {
    const contracts = await this.contractRepository.find({
      where: { companyId },
      relations: ['customer'],
    });
    return contracts.map((c) => toContractResponseDto(c));
  }

  async update(
    id: number,
    dto: UpdateContractDto,
    companyId: number,
  ): Promise<ContractResponseDto> {
    const contract = await this.contractRepository.findOne({
      where: { id, companyId },
      relations: ['customer'],
    });
    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found.`);
    }
    if (dto.customerId !== undefined) {
      const customer = await this.customerRepository.findOne({
        where: { id: dto.customerId, companyId },
      });
      if (!customer) {
        throw new NotFoundException(
          `Customer with ID ${dto.customerId} not found.`,
        );
      }
      contract.customer = customer;
    }
    Object.assign(contract, {
      startDate: dto.startDate ?? contract.startDate,
      endDate: dto.endDate ?? contract.endDate,
      frequency: dto.frequency ?? contract.frequency,
      totalOccurrences: dto.totalOccurrences ?? contract.totalOccurrences,
      jobTemplate: dto.jobTemplate ?? contract.jobTemplate,
    });
    const saved = await this.contractRepository.save(contract);
    await this.generateJobsForContract(saved);
    return toContractResponseDto(saved);
  }

  async cancel(id: number, companyId: number): Promise<void> {
    const contract = await this.contractRepository.findOne({
      where: { id, companyId },
    });
    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found.`);
    }
    contract.active = false;
    await this.contractRepository.save(contract);
    this.metrics?.incrementCounter('contracts_expired_total', {
      route: 'contracts.cancel',
      companyId,
      status: 'expired',
    });
  }

  async generateJobsForContract(contract: Contract): Promise<void> {
    if (!contract.active) return;
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
        title: contract.jobTemplate.title,
        description: contract.jobTemplate.description,
        estimatedHours: contract.jobTemplate.estimatedHours,
        notes: contract.jobTemplate.notes,
        scheduledDate: nextDate,
        customer: contract.customer,
        companyId: contract.companyId,
        contract: { id: contract.id } as Contract,
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
      where: { active: true },
      relations: ['customer'],
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

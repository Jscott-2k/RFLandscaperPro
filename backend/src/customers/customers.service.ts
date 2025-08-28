import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { Repository, QueryFailedError } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(
    createCustomerDto: CreateCustomerDto,
    companyId: number,
  ): Promise<CustomerResponseDto> {
    try {
      const customer = this.customerRepository.create({
        ...createCustomerDto,
        companyId,
      });
      const savedCustomer = await this.customerRepository.save(customer);
      return this.toCustomerResponseDto(savedCustomer);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (
          error as QueryFailedError & {
            driverError?: { code?: string };
          }
        ).driverError?.code === '23505'
      ) {
        throw new ConflictException('Email already exists');
      }
      throw new InternalServerErrorException('Failed to create customer');
    }
  }

  async findAll(
    pagination: PaginationQueryDto,
    companyId: number,
    active?: boolean,
  ): Promise<{ items: CustomerResponseDto[]; total: number }> {
    const { page = 1, limit = 10 } = pagination;
    const cappedLimit = Math.min(limit, 100);
    const queryBuilder = this.customerRepository
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.jobs', 'jobs')
      .leftJoinAndSelect('customer.addresses', 'addresses')
      .where('customer.companyId = :companyId', { companyId });

    if (active !== undefined) {
      queryBuilder.andWhere('customer.active = :active', { active });
    }

    const [customers, total] = await queryBuilder
      .skip((page - 1) * cappedLimit)
      .take(cappedLimit)
      .orderBy('customer.name', 'ASC')
      .getManyAndCount();

    return {
      items: customers.map((customer) => this.toCustomerResponseDto(customer)),
      total,
    };
  }

  async findOne(id: number, companyId: number): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findOne({
      where: { id, companyId },
      relations: ['jobs', 'addresses'],
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found.`);
    }
    return this.toCustomerResponseDto(customer);
  }

  async findByUserId(
    userId: number,
    companyId: number,
  ): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findOne({
      where: { userId, companyId },
      relations: ['jobs', 'addresses'],
    });
    if (!customer) {
      throw new NotFoundException(`Customer with userId ${userId} not found.`);
    }
    return this.toCustomerResponseDto(customer);
  }

  async update(
    id: number,
    updateCustomerDto: UpdateCustomerDto,
    companyId: number,
  ): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findOne({
      where: { id, companyId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found.`);
    }
    Object.assign(customer, updateCustomerDto);
    const updatedCustomer = await this.customerRepository.save(customer);
    return this.toCustomerResponseDto(updatedCustomer);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const customer = await this.customerRepository.findOne({
      where: { id, companyId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found.`);
    }
    await this.customerRepository.remove(customer);
  }

  async deactivate(
    id: number,
    companyId: number,
  ): Promise<CustomerResponseDto> {
    await this.findOne(id, companyId);
    return this.update(id, { active: false }, companyId);
  }

  async activate(id: number, companyId: number): Promise<CustomerResponseDto> {
    await this.findOne(id, companyId);
    return this.update(id, { active: true }, companyId);
  }

  private toCustomerResponseDto(customer: Customer): CustomerResponseDto {
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      notes: customer.notes,
      active: customer.active,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      userId: customer.userId,
      jobs: customer.jobs?.map((job) => ({
        id: job.id,
        title: job.title,
      })),
      addresses: customer.addresses?.map((addr) => ({
        id: addr.id,
        street: addr.street,
        city: addr.city,
        state: addr.state,
        zip: addr.zip,
        unit: addr.unit,
        notes: addr.notes,
        primary: addr.primary,
      })),
    };
  }
}

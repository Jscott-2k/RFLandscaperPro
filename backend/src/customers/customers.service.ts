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

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(
    createCustomerDto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    try {
      const customer = this.customerRepository.create(createCustomerDto);
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
    page = 1,
    limit = 10,
    active?: boolean,
  ): Promise<{ items: CustomerResponseDto[]; total: number }> {
    const queryBuilder = this.customerRepository.createQueryBuilder('customer');

    if (active !== undefined) {
      queryBuilder.andWhere('customer.active = :active', { active });
    }

    const [customers, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('customer.name', 'ASC')
      .getManyAndCount();

    return {
      items: customers.map((customer) => this.toCustomerResponseDto(customer)),
      total,
    };
  }

  async findOne(id: number): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found.`);
    }
    return this.toCustomerResponseDto(customer);
  }

  async update(
    id: number,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found.`);
    }
    Object.assign(customer, updateCustomerDto);
    const updatedCustomer = await this.customerRepository.save(customer);
    return this.toCustomerResponseDto(updatedCustomer);
  }

  async remove(id: number): Promise<void> {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found.`);
    }
    await this.customerRepository.remove(customer);
  }

  async deactivate(id: number): Promise<CustomerResponseDto> {
    const customer = await this.findOne(id);
    return this.update(id, { active: false });
  }

  async activate(id: number): Promise<CustomerResponseDto> {
    const customer = await this.findOne(id);
    return this.update(id, { active: true });
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

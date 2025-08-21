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
    companyId: number,
    createCustomerDto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    try {
      const customer = this.customerRepository.create({
        ...createCustomerDto,
        company: { id: companyId } as any,
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
    companyId: number,
    page = 1,
    limit = 10,
  ): Promise<{ items: CustomerResponseDto[]; total: number }> {
    const [customers, total] = await this.customerRepository.findAndCount({
      where: { company: { id: companyId } },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      items: customers.map((customer) => this.toCustomerResponseDto(customer)),
      total,
    };
  }

  async findOne(companyId: number, id: number): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findOne({
      where: { id, company: { id: companyId } },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found.`);
    }
    return this.toCustomerResponseDto(customer);
  }

  async update(
    companyId: number,
    id: number,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findOne({
      where: { id, company: { id: companyId } },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found.`);
    }
    Object.assign(customer, updateCustomerDto);
    const updatedCustomer = await this.customerRepository.save(customer);
    return this.toCustomerResponseDto(updatedCustomer);
  }

  async remove(companyId: number, id: number): Promise<void> {
    const customer = await this.customerRepository.findOne({
      where: { id, company: { id: companyId } },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found.`);
    }
    await this.customerRepository.remove(customer);
  }

  private toCustomerResponseDto(customer: Customer): CustomerResponseDto {
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
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
      })),
    };
  }
}

import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Address } from './entities/address.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import {
  ICustomerRepository,
  CUSTOMER_REPOSITORY,
} from './repositories/customer.repository';
import { Inject } from '@nestjs/common';
import { toCustomerResponseDto } from './customers.mapper';

@Injectable()
export class CustomersService {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
  ) {}

  async create(
    createCustomerDto: CreateCustomerDto,
    companyId: number,
  ): Promise<CustomerResponseDto> {
    try {
      const customer = this.customerRepository.create({
        ...createCustomerDto,
        companyId,
        addresses: createCustomerDto.addresses?.map((addr) => ({
          ...addr,
          companyId,
        })) as Address[],
      });
      const savedCustomer = await this.customerRepository.save(customer);
      return toCustomerResponseDto(savedCustomer);
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
    search?: string,
  ): Promise<{ items: CustomerResponseDto[]; total: number }> {
    const [customers, total] = await this.customerRepository.findAll(
      pagination,
      companyId,
      active,
      search,
    );

    return {
      items: customers.map((customer) => toCustomerResponseDto(customer)),
      total,
    };
  }

  async findOne(id: number, companyId: number): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findById(id, companyId);
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found.`);
    }
    return toCustomerResponseDto(customer);
  }

  async findByUserId(
    userId: number,
    companyId: number,
  ): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findByUserId(
      userId,
      companyId,
    );
    if (!customer) {
      throw new NotFoundException(`Customer with userId ${userId} not found.`);
    }
    return toCustomerResponseDto(customer);
  }

  async update(
    id: number,
    updateCustomerDto: UpdateCustomerDto,
    companyId: number,
  ): Promise<CustomerResponseDto> {
    const customer = await this.customerRepository.findById(id, companyId);
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found.`);
    }
    Object.assign(customer, updateCustomerDto);
    const updatedCustomer = await this.customerRepository.save(customer);
    return toCustomerResponseDto(updatedCustomer);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const customer = await this.customerRepository.findById(id, companyId);
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
}

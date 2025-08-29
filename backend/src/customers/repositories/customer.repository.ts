import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export const CUSTOMER_REPOSITORY = Symbol('CUSTOMER_REPOSITORY');

export interface ICustomerRepository {
  create(data: Partial<Customer>): Customer;
  save(customer: Customer): Promise<Customer>;
  findAll(
    pagination: PaginationQueryDto,
    companyId: number,
    active?: boolean,
    search?: string,
  ): Promise<[Customer[], number]>;
  findById(id: number, companyId: number): Promise<Customer | null>;
  findByUserId(userId: number, companyId: number): Promise<Customer | null>;
  remove(customer: Customer): Promise<void>;
}

@Injectable()
export class CustomerRepository implements ICustomerRepository {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
  ) {}

  create(data: Partial<Customer>): Customer {
    return this.repo.create(data);
  }

  save(customer: Customer): Promise<Customer> {
    return this.repo.save(customer);
  }

  async findAll(
    pagination: PaginationQueryDto,
    companyId: number,
    active?: boolean,
    search?: string,
  ): Promise<[Customer[], number]> {
    const { page = 1, limit = 10 } = pagination;
    const cappedLimit = Math.min(limit, 100);
    const queryBuilder = this.repo
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.jobs', 'jobs')
      .leftJoinAndSelect('customer.addresses', 'addresses')
      .where('customer.companyId = :companyId', { companyId });

    if (active !== undefined) {
      queryBuilder.andWhere('customer.active = :active', { active });
    }

    if (search) {
      queryBuilder.andWhere(
        '(customer.name ILIKE :search OR customer.email ILIKE :search OR customer.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    return queryBuilder
      .skip((page - 1) * cappedLimit)
      .take(cappedLimit)
      .orderBy('customer.name', 'ASC')
      .getManyAndCount();
  }

  findById(id: number, companyId: number): Promise<Customer | null> {
    return this.repo.findOne({
      where: { id, companyId },
      relations: ['jobs', 'addresses'],
    });
  }

  findByUserId(userId: number, companyId: number): Promise<Customer | null> {
    return this.repo.findOne({
      where: { userId, companyId },
      relations: ['jobs', 'addresses'],
    });
  }

  async remove(customer: Customer): Promise<void> {
    await this.repo.remove(customer);
  }
}

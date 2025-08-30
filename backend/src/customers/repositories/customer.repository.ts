import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { Paginated, PaginationParams, paginate } from '../../common/pagination';

export const CUSTOMER_REPOSITORY = Symbol('CUSTOMER_REPOSITORY');

export interface ICustomerRepository {
  create(data: Partial<Customer>): Customer;
  save(customer: Customer): Promise<Customer>;
  findAll(
    pagination: PaginationParams,
    companyId: number,
    active?: boolean,
    search?: string,
  ): Promise<Paginated<Customer>>;
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
    pagination: PaginationParams,
    companyId: number,
    active?: boolean,
    search?: string,
  ): Promise<Paginated<Customer>> {
    return paginate(this.repo, pagination, 'customer', (qb) => {
      qb.leftJoinAndSelect('customer.jobs', 'jobs')
        .leftJoinAndSelect('customer.addresses', 'addresses')
        .where('customer.companyId = :companyId', { companyId });

      if (active !== undefined) {
        qb.andWhere('customer.active = :active', { active });
      }

      if (search) {
        qb.andWhere(
          '(customer.name ILIKE :search OR customer.email ILIKE :search OR customer.phone ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      return qb;
    });
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

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';
import { Repository, QueryFailedError, SelectQueryBuilder } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

describe('CustomersService', () => {
  let service: CustomersService;

  let repo: jest.Mocked<Repository<Customer>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: getRepositoryToken(Customer),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    repo = module.get(getRepositoryToken(Customer));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('throws ConflictException when email already exists in same company', async () => {
    repo.create.mockReturnValue({} as Customer);
    repo.save.mockRejectedValue(
      new QueryFailedError('', [], { code: '23505' } as any),
    );

    const createCustomerDto: CreateCustomerDto = {
      name: 'John Doe',
      email: 'john@example.com',
      addresses: [
        {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zip: '12345',
        },
      ],
    };

    const promise = service.create(createCustomerDto, 1);
    await expect(promise).rejects.toBeInstanceOf(ConflictException);
    await expect(promise).rejects.toHaveProperty(
      'message',
      'Email already exists',
    );
  });

  it('allows duplicate emails across different companies', async () => {
    repo.create.mockImplementation((dto) => dto as any);
    repo.save
      .mockResolvedValueOnce({ id: 1 } as Customer)
      .mockResolvedValueOnce({ id: 2 } as Customer);

    const createCustomerDto: CreateCustomerDto = {
      name: 'John Doe',
      email: 'john@example.com',
      addresses: [
        {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zip: '12345',
        },
      ],
    };

    await expect(service.create(createCustomerDto, 1)).resolves.toBeDefined();
    await expect(service.create(createCustomerDto, 2)).resolves.toBeDefined();
  });

  it('should apply search filter when finding all customers', async () => {
    const qb: Record<string, jest.Mock> = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };

    (repo.createQueryBuilder as jest.Mock).mockReturnValue(
      qb as unknown as SelectQueryBuilder<Customer>,
    );

    const pagination: PaginationQueryDto = { page: 1, limit: 10 };
    await service.findAll(pagination, 1, undefined, 'Jane');

    expect(qb.andWhere).toHaveBeenCalledWith(
      '(customer.name ILIKE :search OR customer.email ILIKE :search OR customer.phone ILIKE :search)',
      { search: '%Jane%' },
    );
    expect(qb.getManyAndCount).toHaveBeenCalled();
  });
});

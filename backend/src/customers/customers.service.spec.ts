import { ConflictException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { QueryFailedError } from 'typeorm';

import { type PaginationParams } from '../common/pagination';
import { CustomersService } from './customers.service';
import { type CreateCustomerDto } from './dto/create-customer.dto';
import { type Customer } from './entities/customer.entity';
import {
  CUSTOMER_REPOSITORY,
  type ICustomerRepository,
} from './repositories/customer.repository';

describe('CustomersService', () => {
  let service: CustomersService;

  let repo: jest.Mocked<ICustomerRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: CUSTOMER_REPOSITORY,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findByUserId: jest.fn(),
            remove: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    repo = module.get(CUSTOMER_REPOSITORY);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('throws ConflictException when email already exists in same company', async () => {
    const createMock = jest
      .spyOn(repo, 'create')
      .mockReturnValue({} as Customer);
    repo.save.mockRejectedValue(
      new QueryFailedError('', [], { code: '23505' } as any),
    );

    const createCustomerDto: CreateCustomerDto = {
      addresses: [
        {
          city: 'Anytown',
          state: 'CA',
          street: '123 Main St',
          zip: '12345',
        },
      ],
      email: 'john@example.com',
      name: 'John Doe',
    };

    const promise = service.create(createCustomerDto, 1);
    await expect(promise).rejects.toBeInstanceOf(ConflictException);
    await expect(promise).rejects.toHaveProperty(
      'message',
      'Email already exists',
    );
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        addresses: [
          expect.objectContaining({
            city: 'Anytown',
            companyId: 1,
            state: 'CA',
            street: '123 Main St',
            zip: '12345',
          }),
        ],
        companyId: 1,
        email: 'john@example.com',
        name: 'John Doe',
      }),
    );
  });

  it('allows duplicate emails across different companies', async () => {
    repo.create.mockImplementation((dto: Partial<Customer>) => dto as Customer);
    repo.save
      .mockResolvedValueOnce({ id: 1 } as Customer)
      .mockResolvedValueOnce({ id: 2 } as Customer);

    const createCustomerDto: CreateCustomerDto = {
      addresses: [
        {
          city: 'Anytown',
          state: 'CA',
          street: '123 Main St',
          zip: '12345',
        },
      ],
      email: 'john@example.com',
      name: 'John Doe',
    };

    await expect(service.create(createCustomerDto, 1)).resolves.toBeDefined();
    await expect(service.create(createCustomerDto, 2)).resolves.toBeDefined();
  });

  it('should apply search filter when finding all customers', async () => {
    const findAllMock = jest
      .spyOn(repo, 'findAll')
      .mockResolvedValue({ items: [], nextCursor: null });
    const pagination: PaginationParams = { limit: 10 };
    await service.findAll(pagination, 1, undefined, 'Jane');
    expect(findAllMock).toHaveBeenCalledWith(pagination, 1, undefined, 'Jane');
  });
});

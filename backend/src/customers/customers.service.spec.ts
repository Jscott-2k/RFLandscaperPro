import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';
import { QueryFailedError } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import {
  CUSTOMER_REPOSITORY,
  ICustomerRepository,
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
            save: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findByUserId: jest.fn(),
            remove: jest.fn(),
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
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'John Doe',
        email: 'john@example.com',
        companyId: 1,
        addresses: [
          expect.objectContaining({
            street: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            zip: '12345',
            companyId: 1,
          }),
        ],
      }),
    );
  });

  it('allows duplicate emails across different companies', async () => {
    repo.create.mockImplementation((dto: Partial<Customer>) => dto as Customer);
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
    const findAllMock = jest.spyOn(repo, 'findAll').mockResolvedValue([[], 0]);
    const pagination: PaginationQueryDto = { page: 1, limit: 10 };
    await service.findAll(pagination, 1, undefined, 'Jane');
    expect(findAllMock).toHaveBeenCalledWith(pagination, 1, undefined, 'Jane');
  });
});

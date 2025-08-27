import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';
import { Repository, QueryFailedError } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';

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

  it('throws ConflictException when email already exists', async () => {
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

    await expect(
      service.create(createCustomerDto, 1),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      service.create(createCustomerDto, 1),
    ).rejects.toHaveProperty('message', 'Email already exists');
  });
});

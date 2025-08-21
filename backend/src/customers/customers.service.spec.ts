import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';
import { Repository, QueryFailedError } from 'typeorm';
import { ConflictException } from '@nestjs/common';

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

    await expect(service.create(1, {} as any)).rejects.toBeInstanceOf(
      ConflictException,
    );
    await expect(service.create(1, {} as any)).rejects.toHaveProperty(
      'message',
      'Email already exists',
    );
  });
});

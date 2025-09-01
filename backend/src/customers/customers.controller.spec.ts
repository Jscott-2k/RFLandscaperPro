import 'reflect-metadata';
import { Test, type TestingModule } from '@nestjs/testing';

import { PaginationParams } from '../common/pagination';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

describe('CustomersController', () => {
  let controller: CustomersController;
  let service: CustomersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        {
          provide: CustomersService,
          useValue: {
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CustomersController>(CustomersController);
    service = module.get<CustomersService>(CustomersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service with companyId, active flag, and search term', async () => {
      const pagination = new PaginationParams();
      pagination.limit = 10;
      const companyId = 1;
      const result = { items: [], nextCursor: null };
      const findAllSpy = jest
        .spyOn(service, 'findAll')
        .mockResolvedValue(result);

      const response = await controller.findAll(
        pagination,
        companyId,
        true,
        'john',
      );

      expect(findAllSpy).toHaveBeenCalledWith(
        pagination,
        companyId,
        true,
        'john',
      );
      expect(response).toBe(result);
    });
  });
});

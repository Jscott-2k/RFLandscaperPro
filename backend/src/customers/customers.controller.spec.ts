import { Test, TestingModule } from '@nestjs/testing';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

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
    it('should call service with companyId and active flag', async () => {
      const pagination = new PaginationQueryDto();
      pagination.page = 1;
      pagination.limit = 10;
      const req = { user: { companyId: 1 } };
      const result = { items: [], total: 0 };
      const findAllSpy = jest
        .spyOn(service, 'findAll')
        .mockResolvedValue(result);

      const response = await controller.findAll(pagination, req, true);

      expect(findAllSpy).toHaveBeenCalledWith(pagination, 1, true);
      expect(response).toBe(result);
    });
  });
});

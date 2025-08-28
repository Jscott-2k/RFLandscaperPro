import { Test, TestingModule } from '@nestjs/testing';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CustomerResponseDto } from './dto/customer-response.dto';

describe('CustomersController', () => {
  let controller: CustomersController;
  let service: { activate: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        {
          provide: CustomersService,
          useValue: {
            activate: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CustomersController>(CustomersController);
    service = module.get(CustomersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('activates a customer scoped to company', async () => {
    const customer = {} as CustomerResponseDto;
    service.activate.mockResolvedValue(customer);
    const req = { user: { companyId: 1 } };
    const result = await controller.activate(10, req as any);
    expect(result).toBe(customer);
    expect(service.activate).toHaveBeenCalledWith(10, 1);
  });
});

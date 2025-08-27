import { Test, TestingModule } from '@nestjs/testing';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CustomerResponseDto } from './dto/customer-response.dto';

describe('CustomersController', () => {
  let controller: CustomersController;
  let service: {
    activate: jest.Mock;
    deactivate: jest.Mock;
  };
  const customer: CustomerResponseDto = {
    id: 1,
    name: 'Test Customer',
    email: 'test@example.com',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    service = {
      activate: jest.fn().mockResolvedValue(customer),
      deactivate: jest.fn().mockResolvedValue({ ...customer, active: false }),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        {
          provide: CustomersService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<CustomersController>(CustomersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('activates a customer', async () => {
    const result = await controller.activate(1);
    expect(service.activate).toHaveBeenCalledWith(1);
    expect(result).toEqual(customer);
  });

  it('deactivates a customer', async () => {
    const result = await controller.deactivate(1);
    expect(service.deactivate).toHaveBeenCalledWith(1);
    expect(result).toEqual({ ...customer, active: false });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Equipment } from './entities/equipment.entity';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

describe('EquipmentController', () => {
  let controller: EquipmentController;
  let service: EquipmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipmentController],
      providers: [
        EquipmentService,
        {
          provide: getRepositoryToken(Equipment),
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<EquipmentController>(EquipmentController);
    service = module.get<EquipmentService>(EquipmentService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should pass search query to service', async () => {
    const findAllSpy = jest
      .spyOn(service, 'findAll')
      .mockResolvedValue({ items: [], total: 0 });

    const pagination: PaginationQueryDto = { page: 1, limit: 10 };
    await controller.findAll(
      pagination,
      { user: { companyId: 1 } },
      undefined,
      undefined,
      'tractor',
    );

    expect(findAllSpy).toHaveBeenCalledWith(
      pagination,
      1,
      undefined,
      undefined,
      'tractor',
    );
  });
});

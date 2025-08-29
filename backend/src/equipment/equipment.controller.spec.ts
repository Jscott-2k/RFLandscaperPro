import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';
import { EquipmentResponseDto } from './dto/equipment-response.dto';
import { EquipmentStatus, EquipmentType } from './entities/equipment.entity';

describe('EquipmentController', () => {
  let controller: EquipmentController;
  let service: EquipmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipmentController],
      providers: [
        {
          provide: EquipmentService,
          useValue: {
            updateStatus: jest.fn(),
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EquipmentController>(EquipmentController);
    service = module.get<EquipmentService>(EquipmentService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('updateStatus', () => {
    it('should pass companyId to equipmentService.updateStatus', async () => {
      const companyId = 2;
      const dto = { status: EquipmentStatus.AVAILABLE };
      const response = {} as EquipmentResponseDto;
      const updateStatusMock = jest
        .spyOn(service, 'updateStatus')
        .mockResolvedValue(response);

      const result = await controller.updateStatus(1, dto, companyId);
      expect(updateStatusMock).toHaveBeenCalledWith(1, dto.status, companyId);
      expect(result).toBe(response);
    });
  });

  describe('findAll', () => {
    it('should call equipmentService.findAll with companyId and search term', async () => {
      const pagination = { page: 1, limit: 10 };
      const companyId = 1;
      const status = EquipmentStatus.AVAILABLE;
      const type = EquipmentType.MOWER;
      const search = 'mower';
      const expectedResult = { items: [], total: 0 };
      const findAllMock = jest
        .spyOn(service, 'findAll')
        .mockResolvedValue(expectedResult);

      const result = await controller.findAll(
        pagination,
        companyId,
        status,
        type,
        search,
      );
      expect(result).toEqual(expectedResult);
      expect(findAllMock).toHaveBeenCalledWith(
        pagination,
        companyId,
        status,
        type,
        search,
      );
    });
  });
});

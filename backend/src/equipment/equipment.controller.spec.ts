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
      const req = { user: { companyId: 2 } };
      const dto = { status: EquipmentStatus.AVAILABLE };
      const response = {} as EquipmentResponseDto;
      (service.updateStatus as jest.Mock).mockResolvedValue(response);

      const result = await controller.updateStatus(1, dto, req);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.updateStatus).toHaveBeenCalledWith(
        1,
        dto.status,
        req.user.companyId,
      );
      expect(result).toBe(response);
    });
  });

  describe('findAll', () => {
    it('should call equipmentService.findAll with companyId', async () => {
      const pagination = { page: 1, limit: 10 };
      const req = { user: { companyId: 1 } };
      const status = EquipmentStatus.AVAILABLE;
      const type = EquipmentType.MOWER;
      const expectedResult = { items: [], total: 0 };
      (service.findAll as jest.Mock).mockResolvedValue(expectedResult);

      const result = await controller.findAll(pagination, req, status, type);
      expect(result).toEqual(expectedResult);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(service.findAll).toHaveBeenCalledWith(
        pagination,
        req.user.companyId,
        status,
        type,
      );
    });
  });
});

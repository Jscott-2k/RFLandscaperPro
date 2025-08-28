import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentService } from './equipment.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Equipment, EquipmentStatus } from './entities/equipment.entity';
import { EquipmentResponseDto } from './dto/equipment-response.dto';

describe('EquipmentService', () => {
  let service: EquipmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentService,
        {
          provide: getRepositoryToken(Equipment),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<EquipmentService>(EquipmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateStatus', () => {
    it('should call findOne and update with companyId', async () => {
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({} as EquipmentResponseDto);
      const updateSpy = jest
        .spyOn(service, 'update')
        .mockResolvedValue({} as EquipmentResponseDto);

      await service.updateStatus(1, EquipmentStatus.AVAILABLE, 5);

      expect(findOneSpy).toHaveBeenCalledWith(1, 5);
      expect(updateSpy).toHaveBeenCalledWith(
        1,
        { status: EquipmentStatus.AVAILABLE },
        5,
      );
    });
  });
});

import { Test, type TestingModule } from '@nestjs/testing';

import { type PaginationParams } from '../common/pagination';
import { type EquipmentResponseDto } from './dto/equipment-response.dto';
import { EquipmentStatus } from './entities/equipment.entity';
import { EquipmentService } from './equipment.service';
import {
  EQUIPMENT_REPOSITORY,
  type IEquipmentRepository,
} from './repositories/equipment.repository';

describe('EquipmentService', () => {
  let service: EquipmentService;
  let repo: jest.Mocked<IEquipmentRepository>;

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      remove: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<IEquipmentRepository>;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentService,
        { provide: EQUIPMENT_REPOSITORY, useValue: repo },
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

  it('should apply search filter when finding all equipment', async () => {
    const findAllMock = jest
      .spyOn(repo, 'findAll')
      .mockResolvedValue({ items: [], nextCursor: null });
    const pagination: PaginationParams = { limit: 10 };
    await service.findAll(pagination, 1, undefined, undefined, 'truck');
    expect(findAllMock).toHaveBeenCalledWith(
      pagination,
      1,
      undefined,
      undefined,
      'truck',
    );
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentService } from './equipment.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Equipment, EquipmentStatus } from './entities/equipment.entity';
import { EquipmentResponseDto } from './dto/equipment-response.dto';
import { SelectQueryBuilder } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

describe('EquipmentService', () => {
  let service: EquipmentService;
  let repo: { createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    repo = { createQueryBuilder: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentService,
        {
          provide: getRepositoryToken(Equipment),
          useValue: repo,
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

  it('should apply search filter when finding all equipment', async () => {
    const qb: Record<string, jest.Mock> = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };

    repo.createQueryBuilder.mockReturnValue(
      qb as unknown as SelectQueryBuilder<Equipment>,
    );

    const pagination: PaginationQueryDto = { page: 1, limit: 10 };
    await service.findAll(pagination, 1, undefined, undefined, 'truck');

    expect(qb.andWhere).toHaveBeenCalledWith(
      '(equipment.name ILIKE :search OR equipment.type ILIKE :search OR equipment.description ILIKE :search)',
      { search: '%truck%' },
    );
  });
});

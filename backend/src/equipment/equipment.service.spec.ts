import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentService } from './equipment.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Equipment } from './entities/equipment.entity';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

describe('EquipmentService', () => {
  let service: EquipmentService;
  let equipmentRepository: {
    createQueryBuilder: jest.Mock;
  };

    beforeEach(async () => {
      equipmentRepository = {
        createQueryBuilder: jest.fn(),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EquipmentService,
          {
            provide: getRepositoryToken(Equipment),
            useValue: equipmentRepository,
          },
        ],
      }).compile();

      service = module.get<EquipmentService>(EquipmentService);
    });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('applies search filter when provided', async () => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    equipmentRepository.createQueryBuilder.mockReturnValue(qb);

    const pagination: PaginationQueryDto = { page: 1, limit: 10 };
    await service.findAll(pagination, 1, undefined, undefined, 'mower');

    expect(qb.andWhere).toHaveBeenCalledWith(
      '(equipment.name ILIKE :search OR equipment.description ILIKE :search)',
      { search: '%mower%' },
    );
  });
});

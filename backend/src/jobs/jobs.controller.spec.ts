import { Test, type TestingModule } from '@nestjs/testing';

import { type PaginationParams } from '../common/pagination';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

describe('JobsController', () => {
  let controller: JobsController;
  let jobsService: { findAll: jest.Mock };

  beforeEach(async () => {
    jobsService = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [
        {
          provide: JobsService,
          useValue: jobsService,
        },
      ],
    }).compile();

    controller = module.get<JobsController>(JobsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should forward filters to service.findAll', async () => {
    jobsService.findAll.mockResolvedValue({ items: [], nextCursor: null });
    const pagination: PaginationParams = { limit: 10 };
    const result = await controller.findAll(
      pagination,
      1,
      true,
      2,
      '2023-01-01',
      '2023-01-31',
      3,
      4,
    );
    expect(jobsService.findAll).toHaveBeenCalledWith(
      pagination,
      1,
      true,
      2,
      new Date('2023-01-01'),
      new Date('2023-01-31'),
      3,
      4,
    );
    expect(result).toEqual({ items: [], nextCursor: null });
  });

  describe('findAll', () => {
    it('should call jobsService.findAll with companyId', async () => {
      const pagination: PaginationParams = { limit: 10 };
      const completed = true;
      const customerId = 2;
      const companyId = 1;
      const result = { items: [], nextCursor: null };
      jobsService.findAll.mockResolvedValue(result);

      const response = await controller.findAll(
        pagination,
        companyId,
        completed,
        customerId,
      );

      expect(jobsService.findAll).toHaveBeenCalledWith(
        pagination,
        companyId,
        completed,
        customerId,
        undefined,
        undefined,
        undefined,
        undefined,
      );
      expect(response).toBe(result);
    });
  });
});

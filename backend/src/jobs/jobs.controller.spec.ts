import { Test, TestingModule } from '@nestjs/testing';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */

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
    jobsService.findAll.mockResolvedValue({ items: [], total: 0 });
    const pagination = { page: 1, limit: 10 } as any;
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
    expect(result).toEqual({ items: [], total: 0 });
  });

  describe('findAll', () => {
    it('should call jobsService.findAll with companyId', async () => {
      const pagination = { page: 1, limit: 10 } as any;
      const completed = true;
      const customerId = 2;
      const companyId = 1;
      const result = { items: [], total: 0 };
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

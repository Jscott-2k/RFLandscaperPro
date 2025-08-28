import { Test, TestingModule } from '@nestjs/testing';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

describe('JobsController', () => {
  let controller: JobsController;
  let jobsService: { findAll: jest.Mock };

  beforeEach(async () => {
    jobsService = { findAll: jest.fn() };
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
      { user: { companyId: 1 } },
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
});

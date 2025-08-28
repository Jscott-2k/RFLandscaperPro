import { Test, TestingModule } from '@nestjs/testing';
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

  describe('findAll', () => {
    it('should call jobsService.findAll with companyId', async () => {
      const pagination = { page: 1, limit: 10 } as any;
      const completed = true;
      const customerId = 2;
      const req = { user: { companyId: 1 } } as any;
      const result = { items: [], total: 0 };
      jobsService.findAll.mockResolvedValue(result);

      const response = await controller.findAll(
        pagination,
        req,
        completed,
        customerId,
      );

      expect(jobsService.findAll).toHaveBeenCalledWith(
        pagination,
        req.user.companyId,
        completed,
        customerId,
      );
      expect(response).toBe(result);
    });
  });
});

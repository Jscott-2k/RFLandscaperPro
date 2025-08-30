import './env.test';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ServiceUnavailableException } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { HealthController } from './../src/health/health.controller';
import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

describe('HealthCheck (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const check = jest.fn(async (fns: (() => Promise<unknown>)[]) => {
      try {
        await fns[0]();
        return { status: 'ok' };
      } catch {
        throw new ServiceUnavailableException();
      }
    });
    const pingCheck = jest.fn().mockResolvedValue(undefined);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: { check } },
        { provide: TypeOrmHealthIndicator, useValue: { pingCheck } },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    // expose mocks for tests
    (app as any).check = check;
    (app as any).pingCheck = pingCheck;
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health returns status ok when dependencies are up', () => {
    const check = (app as any).check as jest.Mock;
    const pingCheck = (app as any).pingCheck as jest.Mock;
    check.mockClear();
    pingCheck.mockResolvedValue(undefined);
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({ status: 'ok' });
      });
  });

  it('GET /health fails gracefully when a dependency is down', async () => {
    const check = (app as any).check as jest.Mock;
    const pingCheck = (app as any).pingCheck as jest.Mock;
    pingCheck.mockRejectedValue(new Error('db down'));
    await request(app.getHttpServer()).get('/api/health').expect(503);
  });
});

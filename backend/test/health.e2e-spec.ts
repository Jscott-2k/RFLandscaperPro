import { type INestApplication, ServiceUnavailableException } from '@nestjs/common';
import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { type App } from 'supertest/types';

import { HealthController } from './../src/health/health.controller';

import './env.test';

describe('HealthCheck (e2e)', () => {
  let app: INestApplication<App>;
  let check: jest.Mock;
  let pingCheck: jest.Mock;

  beforeEach(async () => {
    check = jest.fn(async (fns: (() => Promise<unknown>)[]) => {
      try {
        await fns[0]();
        return { status: 'ok' };
      } catch {
        throw new ServiceUnavailableException();
      }
    });
    pingCheck = jest.fn().mockResolvedValue(undefined);
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
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health returns status ok when dependencies are up', () => {
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
    pingCheck.mockRejectedValue(new Error('db down'));
    await request(app.getHttpServer()).get('/api/health').expect(503);
  });
});

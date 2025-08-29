import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { AppService } from './../src/app.service';

// Minimal environment configuration for the application
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.DB_USERNAME = process.env.DB_USERNAME || 'test';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'test';
process.env.DB_NAME = process.env.DB_NAME || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

describe('HealthCheck (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health returns status ok when dependencies are up', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({ status: 'ok' }),
        );
      });
  });

  it('GET /health fails gracefully when a dependency is down', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AppService)
      .useValue({
        // Simulate a failure in a dependency used by the health endpoint
        getHello: () => {
          throw new Error('Dependency failure');
        },
      })
      .compile();

    const failingApp = moduleFixture.createNestApplication();
    failingApp.setGlobalPrefix('api');
    await failingApp.init();

    await request(failingApp.getHttpServer())
      .get('/api/health')
      .expect(503);

    await failingApp.close();
  });
});

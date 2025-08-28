import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { Request, Response, NextFunction } from 'express';
import { AppModule } from './../src/app.module';
import { UserRole } from '../src/users/user.entity';

describe('UsersController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(
      (
        req: Request & { user?: unknown },
        _res: Response,
        next: NextFunction,
      ) => {
        req.user = { role: UserRole.Customer };
        next();
      },
    );
    await app.init();
  });

  it('POST /users returns 403 for non-admin', () => {
    return request(app.getHttpServer())
      .post('/api/users')
      .send({
        username: 'user',
        email: 'user@example.com',
        password: 'SecurePass123!',
      })
      .expect(403);
  });
});

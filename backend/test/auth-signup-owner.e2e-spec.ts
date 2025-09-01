import {
  type INestApplication,
  ConflictException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { type App } from 'supertest/types';

import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';

describe('Auth signup-owner endpoint (e2e)', () => {
  let app: INestApplication<App>;
  let signupOwner: jest.Mock;

  beforeEach(async () => {
    signupOwner = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: { signupOwner } }],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        errorHttpStatusCode: 422,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        whitelist: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('signs up an owner and returns a token', () => {
    signupOwner.mockResolvedValue({ access_token: 'jwt' });
    return request(app.getHttpServer())
      .post('/api/auth/signup-owner')
      .send({
        companyName: 'Acme Co',
        email: 'owner@example.com',
        name: 'Owner',
        password: 'Password1!',
      })
      .expect(201)
      .expect((res: request.Response) => {
        const body = res.body as { access_token: string };
        expect(body.access_token).toBe('jwt');
        expect(signupOwner).toHaveBeenCalled();
      });
  });

  it('returns 409 when email already exists', () => {
    signupOwner.mockRejectedValue(
      new ConflictException('Email already exists'),
    );
    return request(app.getHttpServer())
      .post('/api/auth/signup-owner')
      .send({
        companyName: 'Acme Co',
        email: 'owner@example.com',
        name: 'Owner',
        password: 'Password1!',
      })
      .expect(409);
  });

  it('returns 422 for invalid body', () => {
    return request(app.getHttpServer())
      .post('/api/auth/signup-owner')
      .send({ email: 'owner@example.com' })
      .expect(422);
  });
});

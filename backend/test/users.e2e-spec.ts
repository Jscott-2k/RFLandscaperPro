import './env.test';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { Request, Response, NextFunction } from 'express';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';
import { UserCreationService } from '../src/users/user-creation.service';
import { UserRole, User } from '../src/users/user.entity';
import { Customer } from '../src/customers/entities/customer.entity';
import { Company } from '../src/companies/entities/company.entity';
import { EmailService } from '../src/common/email';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { Reflector } from '@nestjs/core';

describe('UsersController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(Customer), useValue: {} },
        { provide: getRepositoryToken(Company), useValue: {} },
        { provide: UserCreationService, useValue: {} },
        { provide: EmailService, useValue: {} },
        Reflector,
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(
      (
        req: Request & { user?: unknown },
        _res: Response,
        next: NextFunction,
      ) => {
        req.user = { roles: [UserRole.Customer] };
        next();
      },
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
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

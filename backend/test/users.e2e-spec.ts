import { type INestApplication } from '@nestjs/common';
import { APP_GUARD , Reflector } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { type App } from 'supertest/types';

import { EmailService } from '../src/common/email';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { Company } from '../src/companies/entities/company.entity';
import { Customer } from '../src/customers/entities/customer.entity';
import { UserCreationService } from '../src/users/user-creation.service';
import { UserRole, User } from '../src/users/user.entity';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';

import './env.test';

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
        company: {
          address: '123 Street',
          email: 'company@example.com',
          name: 'Acme Co',
          phone: '1234567890',
        },
        email: 'user@example.com',
        firstName: 'First',
        isVerified: false,
        lastName: 'Last',
        password: 'SecurePass123!',
        phone: '1234567890',
        role: 'customer',
        username: 'user',
      })
      .expect(403);
  });
});

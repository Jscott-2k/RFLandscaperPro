import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import { type App } from 'supertest/types';

import { EmailService } from '../src/common/email';
import { Company } from '../src/companies/entities/company.entity';
import { Customer } from '../src/customers/entities/customer.entity';
import { UserCreationService } from '../src/users/user-creation.service';
import { User, UserRole } from '../src/users/user.entity';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';
import { Email } from '../src/users/value-objects/email.vo';

import './env.test';

describe('Owner user endpoints (e2e)', () => {
  let app: INestApplication<App>;
  let users: User[];

  beforeEach(async () => {
    users = [
      Object.assign(new User(), {
        companyId: 1,
        email: new Email('owner1@example.com'),
        id: 1,
        role: UserRole.CompanyOwner,
        username: 'owner1',
      }),
      Object.assign(new User(), {
        companyId: 1,
        email: new Email('worker1@example.com'),
        firstName: 'W1',
        id: 2,
        role: UserRole.Worker,
        username: 'worker1',
      }),
      Object.assign(new User(), {
        companyId: 2,
        email: new Email('owner2@example.com'),
        id: 3,
        role: UserRole.CompanyOwner,
        username: 'owner2',
      }),
      Object.assign(new User(), {
        companyId: 2,
        email: new Email('worker2@example.com'),
        firstName: 'W2',
        id: 4,
        role: UserRole.Worker,
        username: 'worker2',
      }),
    ];

    const usersRepository = {
      find: jest.fn((options: { where?: { companyId?: number } }) => {
        const companyId = options.where?.companyId;
        if (companyId !== undefined) {
          return users.filter((u) => u.companyId === companyId);
        }
        return users;
      }),
      findOne: jest.fn(
        (options: { where: { id: number; companyId?: number } }) =>
          users.find(
            (u) =>
              u.id === options.where.id &&
              (options.where.companyId === undefined ||
                u.companyId === options.where.companyId),
          ),
      ),
      save: jest.fn((user: User) => {
        const existing = users.find((u) => u.id === user.id);
        if (existing) {
          Object.assign(existing, user);
          return existing;
        }
        users.push(user);
        return user;
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: usersRepository },
        { provide: getRepositoryToken(Customer), useValue: {} },
        { provide: getRepositoryToken(Company), useValue: {} },
        { provide: UserCreationService, useValue: {} },
        {
          provide: EmailService,
          useValue: { send: jest.fn() },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(
      (
        req: Request & {
          user?: { userId: number; role: UserRole; companyId: number };
        },
        _res: Response,
        next: NextFunction,
      ) => {
        req.user = { companyId: 1, role: UserRole.CompanyOwner, userId: 1 };
        next();
      },
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('lists only workers from the owner company', () => {
    return request(app.getHttpServer())
      .get('/api/users/workers')
      .expect(200)
      .expect((res: request.Response) => {
        const body = res.body as { id: number }[];
        expect(body.length).toBe(1);
        expect(body[0].id).toBe(2);
      });
  });

  it('allows updating a worker from the same company', () => {
    return request(app.getHttpServer())
      .patch('/api/users/workers/2')
      .send({ firstName: 'Updated' })
      .expect(200)
      .expect((res: request.Response) => {
        const body = res.body as { firstName: string };
        expect(body.firstName).toBe('Updated');
      });
  });

  it('prevents updating workers from another company', () => {
    return request(app.getHttpServer())
      .patch('/api/users/workers/4')
      .send({ firstName: 'Hacker' })
      .expect(404);
  });
});

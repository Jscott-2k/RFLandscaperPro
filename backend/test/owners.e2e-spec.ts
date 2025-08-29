import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { Request, Response, NextFunction } from 'express';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';
import { User, UserRole } from '../src/users/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Customer } from '../src/customers/entities/customer.entity';
import { Company } from '../src/companies/entities/company.entity';
import { EmailService } from '../src/common/email';

describe('Owner user endpoints (e2e)', () => {
  let app: INestApplication<App>;
  let users: User[];

  beforeEach(async () => {
    users = [
      Object.assign(new User(), {
        id: 1,
        username: 'owner1',
        role: UserRole.CompanyOwner,
        companyId: 1,
      }),
      Object.assign(new User(), {
        id: 2,
        username: 'worker1',
        role: UserRole.Worker,
        companyId: 1,
        firstName: 'W1',
      }),
      Object.assign(new User(), {
        id: 3,
        username: 'owner2',
        role: UserRole.CompanyOwner,
        companyId: 2,
      }),
      Object.assign(new User(), {
        id: 4,
        username: 'worker2',
        role: UserRole.Worker,
        companyId: 2,
        firstName: 'W2',
      }),
    ];

    const usersRepository = {
      find: jest.fn((options: { where?: { companyId?: number } }) => {
        if (options.where?.companyId !== undefined) {
          return users.filter((u) => u.companyId === options.where.companyId);
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
        req.user = { userId: 1, role: UserRole.CompanyOwner, companyId: 1 };
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
        expect(body).toHaveLength(1);
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

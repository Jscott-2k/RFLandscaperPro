import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { type App } from 'supertest/types';

import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { type RefreshToken } from '../src/auth/refresh-token.entity';
import { COMPANY_MEMBERSHIP_REPOSITORY } from '../src/auth/repositories/company-membership.repository';
import { REFRESH_TOKEN_REPOSITORY } from '../src/auth/repositories/refresh-token.repository';
import { VERIFICATION_TOKEN_REPOSITORY } from '../src/auth/repositories/verification-token.repository';
import { EmailService } from '../src/common/email';
import { UserCreationService } from '../src/users/user-creation.service';
import { User, UserRole } from '../src/users/user.entity';
import { UsersService } from '../src/users/users.service';
import { Email } from '../src/users/value-objects/email.vo';

import 'reflect-metadata'; 
import './env.test';

describe('Auth login endpoint (e2e)', () => {
  let app: INestApplication<App>;
  let findByEmail: jest.Mock;
  let signAsync: jest.Mock;

  beforeEach(async () => {
    const password = 'Password1!';
    const hashed = await bcrypt.hash(password, 12);
    const user = Object.assign(new User(), {
      email: new Email('verified@example.com'),
      id: 1,
      isVerified: true,
      firstName: 'Verified',
      lastName: 'User',
      password: hashed,
      role: UserRole.Customer,
      username: 'verified',
    });

    findByEmail = jest.fn().mockResolvedValue(user);
    signAsync = jest.fn().mockResolvedValue('token');
    const decode = jest
      .fn()
      .mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: UsersService, useValue: { findByEmail } },
        { provide: UserCreationService, useValue: {} },
        { provide: JwtService, useValue: { decode, signAsync } },
        { provide: ConfigService, useValue: { get: () => '1h' } },
        {
          provide: REFRESH_TOKEN_REPOSITORY,
          useValue: {
            create: jest
              .fn()
              .mockImplementation(
                (data: Partial<RefreshToken>): RefreshToken =>
                  data as RefreshToken,
              ),
            save: jest.fn(),
          },
        },
        { provide: VERIFICATION_TOKEN_REPOSITORY, useValue: {} },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: EmailService, useValue: {} },
        { provide: COMPANY_MEMBERSHIP_REPOSITORY, useValue: {} },
      ],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        errorHttpStatusCode: 400,
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

  it('logs in a verified user and returns a token', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'verified@example.com', password: 'Password1!' })
      .expect(200)
      .expect((res: request.Response) => {
        const body = res.body as { access_token: string };
        expect(body.access_token).toBeDefined();
        expect(findByEmail).toHaveBeenCalledWith('verified@example.com');
        expect(signAsync).toHaveBeenCalled();
      });
  });
});

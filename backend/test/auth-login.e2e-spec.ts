import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import { User, UserRole } from '../src/users/user.entity';
import { Email } from '../src/users/value-objects/email.vo';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserCreationService } from '../src/users/user-creation.service';
import {
  REFRESH_TOKEN_REPOSITORY,
} from '../src/auth/repositories/refresh-token.repository';
import {
  VERIFICATION_TOKEN_REPOSITORY,
} from '../src/auth/repositories/verification-token.repository';
import {
  COMPANY_MEMBERSHIP_REPOSITORY,
} from '../src/auth/repositories/company-membership.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmailService } from '../src/common/email';

describe('Auth login endpoint (e2e)', () => {
  let app: INestApplication<App>;
  let findByEmail: jest.Mock;
  let signAsync: jest.Mock;

  beforeEach(async () => {
    const password = 'Password1!';
    const hashed = await bcrypt.hash(password, 12);
    const user = Object.assign(new User(), {
      id: 1,
      username: 'verified',
      email: new Email('verified@example.com'),
      password: hashed,
      role: UserRole.Customer,
      isVerified: true,
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
        { provide: JwtService, useValue: { signAsync, decode } },
        { provide: ConfigService, useValue: { get: () => '1h' } },
        {
          provide: REFRESH_TOKEN_REPOSITORY,
          useValue: {
            create: jest.fn().mockImplementation((data) => data),
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
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        errorHttpStatusCode: 400,
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


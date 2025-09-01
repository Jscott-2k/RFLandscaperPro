import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CompanyUser } from '../companies/entities/company-user.entity';
import { Company } from '../companies/entities/company.entity';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { RefreshToken } from './refresh-token.entity';
import {
  COMPANY_MEMBERSHIP_REPOSITORY,
  TypeOrmCompanyMembershipRepository,
} from './repositories/company-membership.repository';
import {
  REFRESH_TOKEN_REPOSITORY,
  TypeOrmRefreshTokenRepository,
} from './repositories/refresh-token.repository';
import {
  VERIFICATION_TOKEN_REPOSITORY,
  TypeOrmVerificationTokenRepository,
} from './repositories/verification-token.repository';
import { VerificationToken } from './verification-token.entity';

@Module({
  imports: [
    UsersModule,
    ConfigModule,
    TypeOrmModule.forFeature([
      RefreshToken,
      VerificationToken,
      User,
      Company,
      CompanyUser,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is not defined');
        }

        const expiresIn = config.get<string>('JWT_EXPIRES_IN', '1h');
        return {
          secret,
          signOptions: { expiresIn },
        };
      },
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: TypeOrmRefreshTokenRepository,
    },
    {
      provide: VERIFICATION_TOKEN_REPOSITORY,
      useClass: TypeOrmVerificationTokenRepository,
    },
    {
      provide: COMPANY_MEMBERSHIP_REPOSITORY,
      useClass: TypeOrmCompanyMembershipRepository,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}

import { Module, Logger } from '@nestjs/common';
import {
  CacheModule,
  CacheInterceptor,
  CACHE_MANAGER,
} from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import {
  PrometheusModule,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as Joi from 'joi';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildTypeOrmOptions } from './database/typeorm.config';
import { CustomersModule } from './customers/customers.module';
import { JobsModule } from './jobs/jobs.module';
import { EquipmentModule } from './equipment/equipment.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { ContractsModule } from './contracts/contracts.module';
import { APP_GUARD, APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { MetricsThrottlerGuard } from './common/guards/metrics-throttler.guard';
import { TenantGuard } from './common/tenant.guard';
import { LoggerModule } from './logger/logger.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { MetricsModule } from './metrics/metrics.module';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthModule } from './health/health.module';
import { EmailModule } from './common/email';

// --- Env file resolution ---
const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
const envFile = `.env.${nodeEnv}`;
const candidates = [
  path.resolve(process.cwd(), envFile),
  path.resolve(__dirname, '..', '..', envFile), // dist/src -> backend/.env.*
  path.resolve(__dirname, '..', envFile), // src -> backend/.env.*
  path.resolve(process.cwd(), '.env'),
];

const envFilePath = candidates.find((p) => fs.existsSync(p));

if (envFilePath) {
  console.log(`[config] Loaded env file: ${envFilePath}`);
} else {
  console.warn(
    `[config] No env file found (${envFile}). Tried:\n - ${candidates.join(
      '\n - ',
    )}\nContinuing with process.env only.`,
  );
}

@Module({
  imports: [
    PrometheusModule.register({ global: true }),
    LoggerModule,
    MetricsModule,
    HealthModule,
    EmailModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envFilePath ? [envFilePath] : [],
      ignoreEnvFile: !envFilePath,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),

        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),

        JWT_SECRET: Joi.string().required(),
        LOG_LEVEL: Joi.string().default('debug'),
        CACHE_TTL: Joi.number().default(60_000),
        CACHE_MAX: Joi.number().default(100),
        THROTTLE_TTL: Joi.number().default(60),
        THROTTLE_LIMIT: Joi.number().default(20),
      }).unknown(true),
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: Number(config.get('CACHE_TTL')) || 60_000,
        max: Number(config.get('CACHE_MAX')) || 100,
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: Number(config.get('THROTTLE_TTL')) || 60,
            limit: Number(config.get('THROTTLE_LIMIT')) || 20,
          },
        ],
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProd = process.env.NODE_ENV === 'production';
        new Logger('TYPEORM_FACTORY').log(
          `[TYPEORM_FACTORY] Connecting to DB in ${isProd ? 'production' : 'development'} mode`,
        );
        return buildTypeOrmOptions(config);
      },
    }),

    CustomersModule,
    JobsModule,
    EquipmentModule,
    UsersModule,
    AuthModule,
    CompaniesModule,
    ContractsModule,
  ],
  controllers: [],
  providers: [
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'path', 'status_code'],
    }),
    LoggingInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useFactory: (cache: Cache, reflector: Reflector) =>
        new CacheInterceptor(cache, reflector),
      inject: [CACHE_MANAGER, Reflector],
    },
    {
      provide: APP_GUARD,
      useClass: MetricsThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}

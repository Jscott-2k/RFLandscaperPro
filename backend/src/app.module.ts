import {
  CacheModule,
  CacheInterceptor,
} from '@nestjs/cache-manager';
import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  PrometheusModule,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';
import * as Joi from 'joi';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { DataSource } from 'typeorm';

import { AuthModule } from './auth/auth.module';
import { EmailModule } from './common/email';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { MetricsThrottlerGuard } from './common/guards/metrics-throttler.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TenantGuard } from './common/tenant.guard';
import { CompaniesModule } from './companies/companies.module';
import { ContractsModule } from './contracts/contracts.module';
import { CustomersModule } from './customers/customers.module';
import { buildTypeOrmOptions } from './database/typeorm.config';
import { EquipmentModule } from './equipment/equipment.module';
import { HealthModule } from './health/health.module';
import { JobsModule } from './jobs/jobs.module';
import { LoggerModule } from './logger/logger.module';
import { MetricsModule } from './metrics/metrics.module';
import { UsersModule } from './users/users.module';

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
  controllers: [],
  imports: [
    PrometheusModule.register({ global: true }),
    MetricsModule,
    HealthModule,
    EmailModule,
    LoggerModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      envFilePath: envFilePath ? [envFilePath] : [],
      ignoreEnvFile: !envFilePath,
      isGlobal: true,
      validationSchema: Joi.object({
        CACHE_MAX: Joi.number().default(100),
        CACHE_TTL: Joi.number().default(60_000),

        DB_HOST: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().required(),

        JWT_SECRET: Joi.string().required(),
        LOG_LEVEL: Joi.string().default('debug'),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        THROTTLE_LIMIT: Joi.number().default(20),
        THROTTLE_TTL: Joi.number().default(60),
      }).unknown(true),
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      isGlobal: true,
      useFactory: (config: ConfigService) => ({
        max: Number(config.get('CACHE_MAX')) || 100,
        ttl: Number(config.get('CACHE_TTL')) || 60_000,
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            limit: Number(config.get('THROTTLE_LIMIT')) || 20,
            ttl: Number(config.get('THROTTLE_TTL')) || 60,
          },
        ],
      }),
    }),
    TypeOrmModule.forRootAsync({
      dataSourceFactory: async (options) => {
        try {
          if (!options) {
            throw new Error(
              'TypeORM dataSourceFactory received undefined options.',
            );
          }
          return await new DataSource(options).initialize();
        } catch (err) {
          const logger = new Logger('TYPEORM_FACTORY');
          const msg = err instanceof Error ? err.message : String(err);
          logger.error(
            `Database connection failed: ${msg}`,
            err instanceof Error ? err.stack : undefined,
          );
          throw err;
        }
      },
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProd = process.env.NODE_ENV === 'production';
        new Logger('TYPEORM_FACTORY').log(
          `[TYPEORM_FACTORY] Connecting to DB in ${isProd ? 'production' : 'development'} mode`,
        );
        return {
          ...buildTypeOrmOptions(config),
          retryAttempts: 1,
          retryDelay: 0,
        };
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
  providers: [
    makeHistogramProvider({
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'path', 'status_code'],
      name: 'http_request_duration_seconds',
    }),
    LoggingInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
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

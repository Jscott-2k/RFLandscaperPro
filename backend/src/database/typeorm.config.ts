// src/database/typeorm.config.ts
import { join } from 'path';
import { existsSync } from 'fs';
import type { DataSourceOptions } from 'typeorm';
import type { ConfigService } from '@nestjs/config';
import { config as dotenvLoad } from 'dotenv';

function env(nodeEnv = process.env.NODE_ENV || 'development') {
  return {
    NODE_ENV: nodeEnv,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: Number(process.env.DB_PORT ?? 5432),
    DB_USERNAME: process.env.DB_USERNAME,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
  };
}

/**
 * For Nest runtime: prefer ConfigService (validated by ConfigModule).
 * Do NOT read .env files here — ConfigModule already did that.
 */
export function buildTypeOrmOptions(cfg: ConfigService): DataSourceOptions {
  const nodeEnv = cfg.get<string>('NODE_ENV', 'development');
  const isProd = nodeEnv === 'production';

  return {
    type: 'postgres',
    host: cfg.get<string>('DB_HOST')!,
    port: cfg.get<number>('DB_PORT', 5432),
    username: cfg.get<string>('DB_USERNAME')!,
    password: cfg.get<string>('DB_PASSWORD')!,
    database: cfg.get<string>('DB_NAME')!,
    logging: true,
    synchronize: false,
    migrationsRun: false,
    migrations: [join(__dirname, 'migrations/*{.js}')],
    entities: [join(__dirname, '..', '**/*.entity{.ts,.js}')],
    ssl: isProd ? { rejectUnauthorized: false } : false,
  };
}

/**
 * For CLI / scripts: load .env.<NODE_ENV> and build options from raw env.
 * This version includes TS+JS globs so you can generate/run in dev.
 */
export function buildTypeOrmOptionsFromEnv(): DataSourceOptions {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const envFile = `.env.${nodeEnv}`;
  const envPath = join(__dirname, '..', '..', envFile);
  if (existsSync(envPath)) {
    dotenvLoad({ path: envPath });
  } else if (
    !process.env.DB_HOST ||
    !process.env.DB_USERNAME ||
    !process.env.DB_PASSWORD ||
    !process.env.DB_NAME
  ) {
    throw new Error(`Missing required environment file: ${envFile}`);
  }

  const e = env(nodeEnv);
  const isProd = e.NODE_ENV === 'production';

  if (!e.DB_HOST || !e.DB_USERNAME || !e.DB_PASSWORD || !e.DB_NAME) {
    throw new Error(
      `Missing DB env vars (DB_HOST/DB_USERNAME/DB_PASSWORD/DB_NAME); NODE_ENV=${e.NODE_ENV}`,
    );
  }

  return {
    type: 'postgres',
    host: e.DB_HOST,
    port: e.DB_PORT,
    username: e.DB_USERNAME,
    password: e.DB_PASSWORD,
    database: e.DB_NAME,
    synchronize: false,
    migrationsRun: false,
    migrations: [
      join(__dirname, 'migrations/*{.ts,.js}'),
      join(__dirname, '..', 'database', 'migrations/*{.ts,.js}'),
    ],
    entities: [join(__dirname, '..', '**/*.entity{.ts,.js}')],
    ssl: isProd ? { rejectUnauthorized: false } : false,
  };
}

export default buildTypeOrmOptions;

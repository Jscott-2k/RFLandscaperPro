import type { ConfigService } from '@nestjs/config';
import type { DataSourceOptions } from 'typeorm';

import { config as dotenvLoad } from 'dotenv';
import { existsSync } from 'node:fs';
// src/database/typeorm.config.ts
import { join, resolve } from 'node:path';

/* ---------- helpers ---------- */

function coalesce<T>(...vals: (T | undefined | null | '')[]): T | undefined {
  for (const v of vals)
    {if (v !== undefined && v !== null && v !== ('' as any)) {return v as T;}}
  return undefined;
}
function toBool(v: unknown, fallback = false): boolean {
  if (typeof v === 'boolean') {return v;}
  if (typeof v === 'string')
    {return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());}
  return fallback;
}

type OrmLogLevel = 'query' | 'error' | 'warn' | 'schema' | 'log' | 'migration';

function parseLogging(envVal?: string): DataSourceOptions['logging'] {
  const v = (envVal || '').toLowerCase();

  if (v === 'all') {return true;}
  if (v === 'false' || v === 'off' || v === 'none') {return false;}
  if (v === 'true') {return true;}

  // Presets
  if (v === 'query') {return ['query', 'error', 'warn'] as OrmLogLevel[];}
  if (v === 'minimal') {return ['error', 'warn'] as OrmLogLevel[];}

  // Single channels
  if (['query', 'schema', 'error', 'warn', 'log', 'migration'].includes(v)) {
    return [v as OrmLogLevel];
  }

  // Default
  return ['error', 'warn'] as OrmLogLevel[];
}

function commonOptions({
  database,
  host,
  logging,
  password,
  port,
  ssl,
  username,
}: {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
  logging: DataSourceOptions['logging'];
}): DataSourceOptions {
  const entities = [join(__dirname, '..', '**', '*.entity.{ts,js}')];
  const migrations = [
    join(__dirname, 'migrations', '*.{ts,js}'),
    join(__dirname, '..', 'database', 'migrations', '*.{ts,js}'),
  ];

  return {
    database,
    entities,
    // pg driver extras
    extra: {
      connectionTimeoutMillis: 5_000,
      connectTimeoutMS: 5_000,
      idle_in_transaction_session_timeout: 15_000,
      query_timeout: 15_000,
      statement_timeout: 15_000,
    },
    host,
    logging,
    maxQueryExecutionTime: 10_000,

    migrations,
    migrationsRun: false,

    password,
    port,

    // proper top-level SSL flag/object for TypeORM
    ssl: ssl ? { rejectUnauthorized: false } : false,
    // Never block boot:
    synchronize: false,

    type: 'postgres',

    username,
  };
}

/* ---------- For Nest runtime (ConfigModule already loaded env) ---------- */

export function buildTypeOrmOptions(cfg: ConfigService): DataSourceOptions {
  const nodeEnv = cfg.get<string>('NODE_ENV', 'development').toLowerCase();
  const host = cfg.get<string>('DB_HOST', 'localhost');
  const port = Number(cfg.get<number>('DB_PORT', 5432));
  const username = coalesce(
    cfg.get<string>('DB_USERNAME'),
    cfg.get<string>('DB_USER'),
  )!;
  const password = cfg.get<string>('DB_PASSWORD')!;
  const database = cfg.get<string>('DB_NAME')!;
  const ssl = toBool(cfg.get('DB_SSL'), nodeEnv === 'production');

  const logging = parseLogging(cfg.get<string>('TYPEORM_LOGGING'));
  if (!host || !username || !password || !database) {
    throw new Error(
      ' Missing DB env vars (DB_HOST/DB_USERNAME|DB_USER/DB_PASSWORD/DB_NAME',
    );
  }

  return commonOptions({
    database,
    host,
    logging,
    password,
    port,
    ssl,
    username,
  });
}

/* ---------- For CLI/scripts (load .env manually) ---------- */

export function buildTypeOrmOptionsFromEnv(): DataSourceOptions {
  const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
  const envFile = `.env.${nodeEnv}`;

  const candidates = [
    resolve(process.cwd(), envFile),
    resolve(__dirname, '..', '..', envFile), // dist/src -> backend/.env.*
    resolve(__dirname, '..', envFile), // src -> backend/.env.*
    resolve(process.cwd(), '.env'),
  ];
  const envPath = candidates.find((p) => existsSync(p));
  if (envPath) {
    dotenvLoad({ path: envPath });

    console.log(`[typeorm.config] Loaded env file: ${envPath}`);
  }

  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT ?? 5432);
  const username = coalesce(process.env.DB_USERNAME, process.env.DB_USER);
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  const ssl = toBool(process.env.DB_SSL, nodeEnv === 'production');

  if (!host || !username || !password || !database) {
    throw new Error(
      `Missing DB env vars (DB_HOST/DB_USERNAME|DB_USER/DB_PASSWORD/DB_NAME); NODE_ENV=${nodeEnv}`,
    );
  }

  const logging = parseLogging(process.env.TYPEORM_LOGGING);

  return commonOptions({
    database,
    host,
    logging,
    password,
    port,
    ssl,
    username,
  });
}

export default buildTypeOrmOptions;

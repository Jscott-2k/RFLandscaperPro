import { config } from 'dotenv';
config({ path: `.env.${process.env.NODE_ENV || 'development'}` });
import { DataSource, QueryRunner } from 'typeorm';
import { join } from 'path';
import { getCurrentCompanyId } from './src/common/tenant/tenant-context';

const isProduction = process.env.NODE_ENV === 'production';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [join(__dirname, '**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'src/migrations/*{.ts,.js}')],
  migrationsRun: process.env.RUN_MIGRATIONS === 'true',
  synchronize: false,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

const originalCreateQueryRunner: DataSource['createQueryRunner'] =
  dataSource.createQueryRunner.bind(dataSource);

dataSource.createQueryRunner = (
  ...args: Parameters<DataSource['createQueryRunner']>
): ReturnType<DataSource['createQueryRunner']> => {
  const queryRunner = originalCreateQueryRunner(...args);
  const originalQuery = queryRunner.query.bind(queryRunner) as (
    query: string,
    parameters?: unknown[],
  ) => Promise<unknown>;

  queryRunner.query = (async (
    query: string,
    parameters?: unknown[],
  ): Promise<unknown> => {
    const companyId = getCurrentCompanyId();
    const runnerData = (queryRunner.data ?? {}) as {
      companyId?: number;
      [key: string]: unknown;
    };
    if (
      companyId !== undefined &&
      typeof query === 'string' &&
      !query.startsWith('SET app.current_company_id') &&
      runnerData.companyId !== companyId
    ) {
      await originalQuery(`SET app.current_company_id = ${companyId}`);
      queryRunner.data = { ...runnerData, companyId };
    }

    return originalQuery(query, parameters);
  }) as QueryRunner['query'];

  return queryRunner;
};

export default dataSource;

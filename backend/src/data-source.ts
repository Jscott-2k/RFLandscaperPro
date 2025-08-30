import { config } from 'dotenv';
config({ path: `.env.${process.env.NODE_ENV || 'development'}` });
import { DataSource } from 'typeorm';
import { join } from 'path';
import { getCurrentCompanyId } from './common/tenant/tenant-context';

const isProduction = process.env.NODE_ENV === 'production';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [join(__dirname, '**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
  migrationsRun: process.env.RUN_MIGRATIONS === 'true',
  synchronize: false,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

const originalCreateQueryRunner = dataSource.createQueryRunner.bind(dataSource);

dataSource.createQueryRunner = (...args) => {
  const queryRunner = originalCreateQueryRunner(...args);
  const originalQuery = queryRunner.query.bind(queryRunner);

  queryRunner.query = async (query: any, parameters?: any[]) => {
    const companyId = getCurrentCompanyId();
    if (
      companyId !== undefined &&
      typeof query === 'string' &&
      !query.startsWith('SET app.current_company_id') &&
      queryRunner.data?.companyId !== companyId
    ) {
      await originalQuery(`SET app.current_company_id = ${companyId}`);
      queryRunner.data = { ...(queryRunner.data || {}), companyId };
    }

    return originalQuery(query, parameters);
  };

  return queryRunner;
};

export default dataSource;

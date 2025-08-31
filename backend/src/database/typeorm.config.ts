import { config } from 'dotenv';
import { join } from 'path';
import { DataSourceOptions } from 'typeorm';

// Load environment variables based on current NODE_ENV
config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

const isProduction = process.env.NODE_ENV === 'production';

const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [join(__dirname, '..', '**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '..', 'migrations/*{.ts,.js}')],
  // Migrations are executed separately via CLI (npm run migration:run)
  // to avoid unexpected latency and exit behavior at application startup.
  migrationsRun: false,
  synchronize: false,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
};

export default typeOrmConfig;

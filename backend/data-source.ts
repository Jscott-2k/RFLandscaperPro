import { config } from 'dotenv';
config({ path: `.env.${process.env.NODE_ENV || 'development'}` });
import { DataSource } from 'typeorm';
import { join } from 'path';

const isProduction = process.env.NODE_ENV === 'production';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [join(__dirname, '**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'src/migrations/*{.ts,.js}')],
  migrationsRun: true,
  synchronize: false,
  ssl: isProduction
    ? { rejectUnauthorized: false }
    : false,
});

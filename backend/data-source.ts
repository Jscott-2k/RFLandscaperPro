import 'dotenv/config';
import { DataSource } from 'typeorm';

const isProduction = process.env.NODE_ENV === 'production';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Discover entity files in both TS source and compiled JS output
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/**/migrations/*{.ts,.js}'],
  ssl: isProduction
    ? { rejectUnauthorized: false }
    : false
});

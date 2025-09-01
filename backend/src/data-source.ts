// src/data-source.ts
import { DataSource } from 'typeorm';

import { buildTypeOrmOptionsFromEnv } from './database/typeorm.config';

import 'reflect-metadata';

const options = buildTypeOrmOptionsFromEnv();

export default new DataSource(options);

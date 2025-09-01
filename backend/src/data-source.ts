// src/database/data-source.ts
import { DataSource } from 'typeorm';

import { buildTypeOrmOptionsFromEnv } from './database/typeorm.config';

const options = buildTypeOrmOptionsFromEnv();

export default new DataSource(options);

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import dataSource from '../src/data-source';

async function reset(): Promise<void> {
  const sqlPath = resolve(__dirname, 'reset-schema.sql');
  const sql = await readFile(sqlPath, 'utf-8');

  await dataSource.initialize();
  await dataSource.query(sql);
  await dataSource.destroy();

  console.log('Database schema reset.');
}

reset().catch((err) => {
  console.error('Failed to reset database:', err);
  process.exit(1);
});

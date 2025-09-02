import fs from 'node:fs/promises';
import dataSource from '../src/data-source';


async function reset(seed: boolean, sync: boolean, cleanMigrations: boolean): Promise<void> {

  const ds = await dataSource.initialize();
  try {
    if (cleanMigrations) {
      await fs.rm('src/migrations', { recursive: true, force: true });
      console.log(
        'Migrations cleaned. Regenerate them before running migrations.',
      );
    }
    await ds.dropDatabase();
    const hasMigrations = await ds.showMigrations();
    if (sync || !hasMigrations) {
      await ds.synchronize();
    } else {
      await ds.runMigrations();
    }
  } finally {
    await ds.destroy();
  }
  console.log('Database reset.');

  if (seed) {
    await import('../src/seed');
  }
}

const shouldSeed = process.argv.includes('--seed');
const shouldSync = process.argv.includes('--sync') || process.env.DB_SYNC === 'true';
const cleanMigrations = process.argv.includes('--clean-migrations');

reset(shouldSeed, shouldSync, cleanMigrations).catch((err) => {
  console.error('Failed to reset database:', err);
  process.exit(1);
});


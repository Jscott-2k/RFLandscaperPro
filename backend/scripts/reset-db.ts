import fs from 'node:fs/promises';
import dataSource from '../src/data-source';

async function reset(seed: boolean, cleanMigrations: boolean): Promise<void> {
  const ds = await dataSource.initialize();
  try {
    if (cleanMigrations) {
      await fs.rm('src/migrations', { recursive: true, force: true });
      console.log(
        'Migrations cleaned. Regenerate them before running migrations.',
      );
    }
    await ds.dropDatabase();
    await ds.runMigrations();
  } finally {
    await ds.destroy();
  }
  console.log('Database reset.');

  if (seed) {
    await import('../src/seed');
  }
}

const shouldSeed = process.argv.includes('--seed');
const cleanMigrations = process.argv.includes('--clean-migrations');

reset(shouldSeed, cleanMigrations).catch((err) => {
  console.error('Failed to reset database:', err);
  process.exit(1);
});

import dataSource from '../src/data-source';

async function reset(seed: boolean): Promise<void> {
  const ds = await dataSource.initialize();
  try {
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

reset(shouldSeed).catch((err) => {
  console.error('Failed to reset database:', err);
  process.exit(1);
});

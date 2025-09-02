import dataSource from '../src/data-source';

async function truncate(): Promise<void> {
  await dataSource.initialize();

  const tables: Array<{ tablename: string }> = await dataSource.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'migrations';",
  );

  if (tables.length > 0) {
    const tableNames = tables.map((t) => `"${t.tablename}"`).join(', ');
    await dataSource.query(`TRUNCATE ${tableNames} CASCADE;`);
  }

  await dataSource.destroy();

  console.log('Database truncated.');
}

truncate().catch((err) => {
  console.error('Failed to truncate database:', err);
  process.exit(1);
});

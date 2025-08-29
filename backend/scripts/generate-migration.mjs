import { spawnSync } from 'node:child_process';

const MIGRATION_NAME_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/;

const name = process.argv[2] || 'auto';

if (!MIGRATION_NAME_REGEX.test(name)) {
  console.error('Migration name must be a valid TypeScript identifier');
  process.exit(1);
}

const outPath = `src/migrations/${name}`;

const result = spawnSync(
  'ts-node',
  [
    '--transpile-only',
    './node_modules/typeorm/cli.js',
    'migration:generate',
    '-d',
    'data-source.ts',
    outPath,
  ],
  { stdio: 'inherit' },
);

spawnSync('npx', ['prettier', outPath + '.ts', '--write'], {
  stdio: 'inherit',
});
process.exit(result.status ?? 0);

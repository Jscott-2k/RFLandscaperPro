import { spawnSync } from 'node:child_process';

const MIGRATION_NAME_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/;

const name = process.argv[2] || 'auto';

if (!MIGRATION_NAME_REGEX.test(name)) {
  console.error('Migration name must be a valid TypeScript identifier');
  process.exit(1);
}

const migrationsDir = 'src/migrations';
const timestamp = Date.now();
const outPath = `${migrationsDir}/${name}`;
const generatedFile = `${migrationsDir}/${timestamp}-${name}.ts`;

const result = spawnSync(
  'ts-node',
  [
    '--transpile-only',
    './node_modules/typeorm/cli.js',
    'migration:generate',
    outPath,
    '-d',
    'src/data-source.ts',
    '--timestamp',
    timestamp.toString(),
  ],
  { stdio: 'inherit' },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

spawnSync('npx', ['prettier', generatedFile, '--write'], {
  stdio: 'inherit',
});
process.exit(result.status ?? 0);

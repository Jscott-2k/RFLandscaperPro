// scripts/generate-migration.mjs
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const name = process.argv[2] || 'auto';
if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
  console.error('Migration name must be a valid TypeScript identifier');
  process.exit(1);
}

const migrationsDir = path.resolve('src/migrations');
const dsPath = path.resolve('src/data-source.ts');
const timestamp = Date.now();
const outPath = path.join(migrationsDir, name);
if (!fs.existsSync(migrationsDir)) {fs.mkdirSync(migrationsDir, { recursive: true });}

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
console.log(`[migrations] generating -> ${outPath}`);
console.log(`[migrations] datasource  -> ${dsPath}`);
console.log(`[migrations] timestamp   -> ${timestamp}`);

const result = spawnSync(
  npx,
  [
    'typeorm-ts-node-commonjs',
    'migration:generate',
    outPath,
    '-d',
    dsPath,
    '--timestamp',
    String(timestamp),
  ],
  {
    env: {
      ...process.env,
      DEBUG_TYPEORM_CONFIG: '1',
      NODE_ENV: process.env.NODE_ENV || 'development',
      // force-load tsconfig-paths for the node process that runs data-source.ts
      NODE_OPTIONS: [
        process.env.NODE_OPTIONS,
        '--require ts-node/register/transpile-only',
        '--require tsconfig-paths/register'
      ].filter(Boolean).join(' '),
      TS_NODE_PROJECT: 'tsconfig.dev.json' // ensure the dev tsconfig is used
    },
    stdio: 'inherit'
  }
);

if (result.status !== 0) {
  console.error(`[migrations] typeorm CLI exited with code ${result.status ?? 1}`);
  process.exit(result.status ?? 1);
}

process.exit(0);

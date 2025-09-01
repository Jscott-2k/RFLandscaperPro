// scripts/generate-migration.mjs
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// --------------------------- args & paths ---------------------------
const name = process.argv[2] || 'auto';
if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
  console.error('Migration name must be a valid TypeScript identifier');
  process.exit(1);
}

const cwd = process.cwd();
const migrationsDir = path.resolve('src/migrations');
const dsPath = path.resolve('src/data-source.ts');
const timestamp = Date.now();
const outPath = path.join(migrationsDir, name);
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const logFile = path.resolve('migration-debug.log');

// Ensure migrations dir exists
if (!fs.existsSync(migrationsDir)) fs.mkdirSync(migrationsDir, { recursive: true });

// --------------------------- env prep ---------------------------
function uniqWords(s) {
  const seen = new Set();
  return s
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => (seen.has(w) ? false : (seen.add(w), true)))
    .join(' ');
}

const NODE_OPTIONS = uniqWords(
  [
    '--require', 'reflect-metadata',
    '--require', 'ts-node/register',
    '--require', 'tsconfig-paths/register',
    process.env.NODE_OPTIONS,
  ].filter(Boolean).join(' ')
);

const env = {
  ...process.env,
  DEBUG_TYPEORM_CONFIG: process.env.DEBUG_TYPEORM_CONFIG ?? '1',
  NODE_ENV: process.env.NODE_ENV || 'development',
  TS_NODE_PROJECT: process.env.TS_NODE_PROJECT || 'tsconfig.dev.json',
  NODE_OPTIONS,
};

// --------------------------- helpers ---------------------------
function run(cmd, args, label) {
  console.log(`\x1b[36m[migrations]\x1b[0m running: ${cmd} ${args.join(' ')}`);
  const started = Date.now();
  const res = spawnSync(cmd, args, { env, encoding: 'utf-8', windowsHide: true, cwd });
  const out = (res.stdout || '') + (res.stderr || '');
  const elapsed = ((Date.now() - started) / 1000).toFixed(2);

  try {
    fs.appendFileSync(logFile, `\n==== ${label} (${elapsed}s) ====\n${out}\n==== end ${label} ====\n`, 'utf-8');
  } catch { /* ignore */ }

  if (out.trim()) {
    console.log(`\n==== ${label} output (${elapsed}s) ====`);
    process.stdout.write(out.endsWith('\n') ? out : out + '\n');
    console.log('==== end output ====\n');
  }

  return { code: res.status ?? 1, out, elapsed };
}

// --------------------------- banner ---------------------------
console.log(`\x1b[36m[migrations]\x1b[0m generating  -> ${outPath}`);
console.log(`\x1b[36m[migrations]\x1b[0m datasource   -> ${dsPath}`);
console.log(`\x1b[36m[migrations]\x1b[0m timestamp    -> ${timestamp}`);
console.log(`\x1b[36m[migrations]\x1b[0m NODE_ENV     -> ${env.NODE_ENV}`);
console.log(`\x1b[36m[migrations]\x1b[0m TS_NODE_PROJ -> ${env.TS_NODE_PROJECT}`);
console.log(`\x1b[36m[migrations]\x1b[0m NODE_OPTIONS -> ${env.NODE_OPTIONS}`);
console.log(`\x1b[36m[migrations]\x1b[0m log file     -> ${logFile}`);

// --------------------------- 1) schema:log ---------------------------
const schemaArgs = [
  'typeorm-ts-node-commonjs',
  'schema:log',
  '--pretty',
  '-d',
  dsPath,
];
const schema = run(npx, schemaArgs, 'schema:log');

// If schema:log produced nothing, assume no changes.
if (schema.code !== 0 && schema.out.trim() === '') {
  console.warn('\x1b[33m[migrations]\x1b[0m schema:log returned non-zero without output; continuing...');
}
if (schema.out.trim() === '') {
  console.log('\x1b[32m[migrations]\x1b[0m No schema changes detected — nothing to generate.');
  process.exit(0);
}

// --------------------------- 2) migration:generate ---------------------------
const genArgs = [
  'typeorm-ts-node-commonjs',
  'migration:generate',
  outPath,
  '-d',
  dsPath,
  '--timestamp',
  String(timestamp),
];
const gen = run(npx, genArgs, 'migration:generate');

if (gen.code !== 0) {
  console.error('\x1b[31m[migrations]\x1b[0m typeorm CLI exited with code', gen.code);
  console.error('\x1b[31m[migrations]\x1b[0m See detailed output in:', logFile);
  process.exit(gen.code);
}

console.log('\x1b[32m[migrations]\x1b[0m Migration generated successfully.');
process.exit(0);

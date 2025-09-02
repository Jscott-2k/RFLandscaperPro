#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const action = process.argv[2];
if (!['dump', 'restore'].includes(action)) {
  const script = path.basename(process.argv[1]);
  console.error(`Usage: node ${script} <dump|restore> [args]`);
  process.exit(1);
}

const scriptName = action === 'dump' ? 'dump-db' : 'restore-db';
const ext = process.platform === 'win32' ? '.ps1' : '.sh';
const command = process.platform === 'win32' ? 'powershell' : 'bash';
const scriptPath = path.join(dirname, `${scriptName}${ext}`);

const result = spawnSync(command, [scriptPath, ...process.argv.slice(3)], { stdio: 'inherit' });
if (result.error) {
  console.error(result.error);
}
process.exit(result.status ?? 1);

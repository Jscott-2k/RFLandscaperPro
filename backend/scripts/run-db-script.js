#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');

const action = process.argv[2];
if (!['dump', 'restore'].includes(action)) {
  console.error('Usage: node run-db-script.js <dump|restore> [args]');
  process.exit(1);
}

const scriptName = action === 'dump' ? 'dump-db' : 'restore-db';
const ext = process.platform === 'win32' ? '.ps1' : '.sh';
const command = process.platform === 'win32' ? 'powershell' : 'bash';
const scriptPath = path.join(__dirname, `${scriptName}${ext}`);

const result = spawnSync(command, [scriptPath, ...process.argv.slice(3)], { stdio: 'inherit' });
if (result.error) {
  console.error(result.error);
}
process.exit(result.status ?? 1);

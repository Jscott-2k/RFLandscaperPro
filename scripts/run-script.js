#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');

const scriptName = process.argv[2];
if (!scriptName) {
  console.error('Usage: node run-script.js <script> [args]');
  process.exit(1);
}

const ext = process.platform === 'win32' ? '.ps1' : '.sh';
const command = process.platform === 'win32' ? 'powershell' : 'bash';
const scriptPath = path.join(__dirname, `${scriptName}${ext}`);

const result = spawnSync(command, [scriptPath, ...process.argv.slice(3)], {
  stdio: 'inherit',
});
if (result.error) {
  console.error(result.error);
}
process.exit(result.status ?? 1);

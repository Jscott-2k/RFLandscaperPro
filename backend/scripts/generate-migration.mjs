import { spawnSync } from "node:child_process";

const name = process.argv[2] || "auto";
const ts = Date.now();
const outPath = `src/migrations/${ts}-${name}`;

const result = spawnSync(
  "ts-node",
  ["--transpile-only", "./node_modules/typeorm/cli.js",
   "migration:generate", "-d", "data-source.ts", outPath],
  { stdio: "inherit" }
);

process.exit(result.status ?? 0);
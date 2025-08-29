import { spawnSync } from "node:child_process";

const name = process.argv[2] || "auto";
const outPath = `src/migrations/${name}`;

const result = spawnSync(
  "ts-node",
  ["--transpile-only", "./node_modules/typeorm/cli.js",
   "migration:generate", "-d", "data-source.ts", outPath],
  { stdio: "inherit" }
);
spawnSync("npx", ["prettier", outPath + ".ts", "--write"], { stdio: "inherit" });
process.exit(result.status ?? 0);
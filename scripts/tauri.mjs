import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const targetDir =
  process.env.CARGO_TARGET_DIR ?? path.join(os.tmpdir(), 'bruma-cargo-target');

const result = spawnSync('pnpm', ['exec', 'tauri', ...args], {
  stdio: 'inherit',
  env: {
    ...process.env,
    CARGO_TARGET_DIR: targetDir,
  },
});

process.exit(result.status ?? 1);

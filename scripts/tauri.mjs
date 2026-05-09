import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const targetDir =
  process.env.CARGO_TARGET_DIR ?? path.join(os.tmpdir(), 'bruma-cargo-target');

// `shell: true` is required on Windows: there `pnpm` is `pnpm.cmd` and Node's
// spawn does not auto-resolve `.cmd` shims. Harmless on macOS/Linux.
const result = spawnSync('pnpm', ['exec', 'tauri', ...args], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    CARGO_TARGET_DIR: targetDir,
  },
});

process.exit(result.status ?? 1);

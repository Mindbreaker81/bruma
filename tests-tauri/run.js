import os from 'node:os';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const platform = process.platform;

function onPath(command) {
  const checker = platform === 'win32' ? 'where' : 'command -v';
  const shell = platform === 'win32' ? 'cmd' : 'bash';
  const args =
    platform === 'win32'
      ? ['/c', `where ${command}`]
      : ['-lc', `${checker} ${command}`];
  return spawnSync(shell, args, { stdio: 'ignore' }).status === 0;
}

// In CI a missing driver must fail the job, not silently skip it.
const skipCode = process.env.TAURI_E2E_REQUIRED ? 1 : 0;

if (platform === 'linux' && !onPath('WebKitWebDriver')) {
  // eslint-disable-next-line no-console
  console.log(
    'Skipping Tauri native E2E on Linux (missing WebKitWebDriver in PATH). Install `webkit2gtk-driver`.'
  );
  process.exit(skipCode);
}

if (platform === 'win32') {
  // tauri-driver launches msedgedriver (the native driver for WebView2);
  // both must be reachable.
  const tauriDriver = path.join(
    os.homedir(),
    '.cargo',
    'bin',
    'tauri-driver.exe'
  );
  if (!existsSync(tauriDriver) || !onPath('msedgedriver')) {
    // eslint-disable-next-line no-console
    console.log(
      'Skipping Tauri native E2E on Windows (need `cargo install tauri-driver` and msedgedriver in PATH matching the WebView2 runtime).'
    );
    process.exit(skipCode);
  }
}

const args = ['tests-tauri/**/*.spec.js'];

// On Linux CI/headless environments, run through xvfb if available and DISPLAY is not set.
const shouldUseXvfb =
  platform === 'linux' && !process.env.DISPLAY && onPath('xvfb-run');

const command = shouldUseXvfb ? 'xvfb-run' : 'mocha';
const commandArgs = shouldUseXvfb ? ['-a', 'mocha', ...args] : args;

const result = spawnSync(command, commandArgs, {
  stdio: 'inherit',
  shell: platform === 'win32',
});

process.exit(result.status ?? 1);

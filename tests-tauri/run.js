import { spawnSync } from 'node:child_process';

const platform = process.platform;

if (platform === 'linux') {
  const hasWebKitDriver =
    spawnSync('bash', ['-lc', 'command -v WebKitWebDriver'], {
      stdio: 'ignore',
    }).status === 0;

  if (!hasWebKitDriver) {
    // eslint-disable-next-line no-console
    console.log(
      'Skipping Tauri native E2E on Linux (missing WebKitWebDriver in PATH). Install `webkit2gtk-driver`.'
    );
    process.exit(0);
  }
}

const args = ['tests-tauri/**/*.spec.js'];

// On Linux CI/headless environments, run through xvfb if available and DISPLAY is not set.
const shouldUseXvfb =
  platform === 'linux' &&
  !process.env.DISPLAY &&
  spawnSync('bash', ['-lc', 'command -v xvfb-run'], { stdio: 'ignore' })
    .status === 0;

const command = shouldUseXvfb ? 'xvfb-run' : 'mocha';
const commandArgs = shouldUseXvfb ? ['-a', 'mocha', ...args] : args;

const result = spawnSync(command, commandArgs, {
  stdio: 'inherit',
  shell: platform === 'win32',
});

process.exit(result.status ?? 1);

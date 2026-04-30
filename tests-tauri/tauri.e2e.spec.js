import os from 'node:os';
import path from 'node:path';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';

import { expect } from 'chai';
import { Builder, Capabilities } from 'selenium-webdriver';

const repoRoot = path.resolve(process.cwd());

function getApplicationPath() {
  const binary = process.platform === 'win32' ? 'bruma.exe' : 'bruma';
  return path.resolve(repoRoot, 'src-tauri', 'target', 'debug', binary);
}

function getTauriDriverPath() {
  const binary =
    process.platform === 'win32' ? 'tauri-driver.exe' : 'tauri-driver';
  return path.resolve(os.homedir(), '.cargo', 'bin', binary);
}

async function waitForE2EBridge(driver) {
  await driver.wait(async () => {
    const ready = await driver.executeScript(
      'return Boolean(window.brumaE2E);'
    );
    return Boolean(ready);
  }, 60000);
}

let driver;
let tauriDriver;
let exit = false;

before(async function () {
  this.timeout(180000);

  // Build debug binary (no bundling) for tauri-driver.
  spawnSync('pnpm', ['tauri', 'build', '--debug', '--no-bundle'], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, VITE_E2E: '1' },
  });

  const tauriDriverPath = getTauriDriverPath();
  tauriDriver = spawn(tauriDriverPath, [], {
    stdio: [null, process.stdout, process.stderr],
    shell: false,
  });

  tauriDriver.on('error', (error) => {
    // eslint-disable-next-line no-console
    console.error('tauri-driver error:', error);
    process.exit(1);
  });

  tauriDriver.on('exit', (code) => {
    if (!exit) {
      // eslint-disable-next-line no-console
      console.error('tauri-driver exited with code:', code);
      process.exit(1);
    }
  });

  const capabilities = new Capabilities();
  capabilities.set('tauri:options', { application: getApplicationPath() });
  capabilities.setBrowserName('wry');

  driver = await new Builder()
    .withCapabilities(capabilities)
    .usingServer('http://127.0.0.1:4444/')
    .build();

  await waitForE2EBridge(driver);
});

after(async function () {
  this.timeout(30000);
  exit = true;
  try {
    await driver?.quit();
  } finally {
    tauriDriver?.kill();
  }
});

describe('Bruma (Tauri native E2E)', () => {
  it('opens a markdown fixture via backend read_file', async function () {
    this.timeout(60000);

    const e2eDir = path.join(os.homedir(), '.bruma-e2e');
    mkdirSync(e2eDir, { recursive: true });

    const fixtureContent = readFileSync(
      path.resolve(repoRoot, 'tests', 'fixtures', 'search.md'),
      'utf8'
    );
    const fixturePath = path.join(e2eDir, 'search.md');
    writeFileSync(fixturePath, fixtureContent, 'utf8');

    await driver.executeScript(
      'return window.brumaE2E.openFileFromPath(arguments[0]);',
      fixturePath
    );

    const content = await driver.executeScript(
      'return window.brumaE2E.getActiveContent();'
    );

    expect(content).to.contain('# Bruma');
  });

  it('saves current content to a chosen path via backend save_file', async function () {
    this.timeout(60000);

    const e2eDir = path.join(os.homedir(), '.bruma-e2e');
    mkdirSync(e2eDir, { recursive: true });
    const targetPath = path.join(e2eDir, 'saved.md');

    await driver.executeScript(
      'window.brumaE2E.setActiveContent(arguments[0]);',
      '# Guardado desde E2E'
    );

    await driver.executeScript(
      'return window.brumaE2E.saveActiveToPath(arguments[0]);',
      targetPath
    );

    const written = readFileSync(targetPath, 'utf8');
    expect(written).to.equal('# Guardado desde E2E');
  });

  it('opens a recent file via the same event as the native menu', async function () {
    this.timeout(60000);

    const e2eDir = path.join(os.homedir(), '.bruma-e2e');
    mkdirSync(e2eDir, { recursive: true });
    const fileA = path.join(e2eDir, 'a.md');
    const fileB = path.join(e2eDir, 'b.md');
    writeFileSync(fileA, '# A', 'utf8');
    writeFileSync(fileB, '# B', 'utf8');

    await driver.executeScript(
      'return window.brumaE2E.openFileFromPath(arguments[0]);',
      fileA
    );
    await driver.executeScript(
      'return window.brumaE2E.openFileFromPath(arguments[0]);',
      fileB
    );

    // Ensure recent list includes fileA.
    const recent = await driver.executeScript(
      'return window.brumaE2E.getRecentFiles();'
    );
    expect(recent).to.include(fileA);

    // Emit the same event used by the native menu.
    await driver.executeScript(
      'return window.brumaE2E.emitRecentOpen(arguments[0]);',
      fileA
    );

    // Wait until editor reflects fileA.
    await driver.wait(async () => {
      const content = await driver.executeScript(
        'return window.brumaE2E.getActiveContent();'
      );
      return typeof content === 'string' && content.includes('# A');
    }, 10000);
  });
});

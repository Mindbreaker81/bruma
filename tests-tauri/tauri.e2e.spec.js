import os from 'node:os';
import path from 'node:path';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

import { expect } from 'chai';

import { ensureSession, shutdownSession, repoRoot } from './session.js';

let driver;

before(async function () {
  this.timeout(180000);
  driver = await ensureSession();
});

after(async function () {
  this.timeout(30000);
  await shutdownSession();
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

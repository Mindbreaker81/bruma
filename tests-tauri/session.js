import os from 'node:os';
import path from 'node:path';
import { mkdirSync, readFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';

import { Builder, Capabilities } from 'selenium-webdriver';

export const repoRoot = path.resolve(process.cwd());

export function getApplicationPath() {
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

// tauri-driver binds 127.0.0.1:4444 asynchronously; poll until it answers
// (or it dies) instead of racing the WebDriver handshake.
async function waitForTauriDriver(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const response = await fetch('http://127.0.0.1:4444/status');
      if (response.ok) return;
    } catch {
      // not listening yet
    }
    if (tauriDriver?.exitCode !== null && tauriDriver?.exitCode !== undefined) {
      throw new Error(
        `tauri-driver exited before listening (code ${tauriDriver.exitCode})`
      );
    }
    if (Date.now() > deadline) {
      throw new Error('tauri-driver did not listen on 127.0.0.1:4444 in time');
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

let sessionPromise = null;
let tauriDriver = null;
let driver = null;
let exited = false;

// Idempotent: whichever spec runs first builds the debug binary, spawns
// tauri-driver (which picks the platform driver — WebKitWebDriver on Linux,
// msedgedriver on Windows) and opens the WebDriver session.
export function ensureSession() {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      // The `pnpm tauri` wrapper redirects CARGO_TARGET_DIR to the temp dir;
      // force it back to src-tauri/target so getApplicationPath() finds it.
      const build = spawnSync(
        'pnpm',
        ['tauri', 'build', '--debug', '--no-bundle'],
        {
          cwd: repoRoot,
          stdio: 'inherit',
          shell: process.platform === 'win32',
          env: {
            ...process.env,
            VITE_E2E: '1',
            CARGO_TARGET_DIR: path.join(repoRoot, 'src-tauri', 'target'),
          },
        }
      );
      if (build.status !== 0) {
        throw new Error(`tauri build failed with status ${build.status}`);
      }

      tauriDriver = spawn(getTauriDriverPath(), [], {
        stdio: [null, process.stdout, process.stderr],
        shell: false,
      });

      tauriDriver.on('error', (error) => {
        // eslint-disable-next-line no-console
        console.error('tauri-driver error:', error);
        process.exit(1);
      });

      tauriDriver.on('exit', (code) => {
        if (!exited) {
          // eslint-disable-next-line no-console
          console.error('tauri-driver exited with code:', code);
          process.exit(1);
        }
      });

      await waitForTauriDriver();

      const capabilities = new Capabilities();
      const tauriOptions = { application: getApplicationPath() };
      if (process.platform === 'win32') {
        // wry places WebView2's user data folder under the app's local data
        // dir; msedgedriver looks there for DevToolsActivePort, so the
        // capability must point at the exact same folder.
        const tauriConf = JSON.parse(
          readFileSync(path.join(repoRoot, 'src-tauri', 'tauri.conf.json'))
        );
        const userDataFolder = path.join(
          process.env.LOCALAPPDATA,
          tauriConf.identifier,
          'EBWebView'
        );
        mkdirSync(userDataFolder, { recursive: true });
        tauriOptions.webviewOptions = { userDataFolder };
      }
      capabilities.set('tauri:options', tauriOptions);
      capabilities.setBrowserName('wry');

      driver = await new Builder()
        .withCapabilities(capabilities)
        .usingServer('http://127.0.0.1:4444/')
        .build();

      await waitForE2EBridge(driver);
      return driver;
    })();
  }
  return sessionPromise;
}

export async function shutdownSession() {
  exited = true;
  try {
    await driver?.quit();
  } catch {
    // Session may already be dead if the app crashed mid-run.
  } finally {
    tauriDriver?.kill();
  }
}

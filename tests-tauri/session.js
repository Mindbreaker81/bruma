import os from 'node:os';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';

import { Builder, By, Capabilities } from 'selenium-webdriver';

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

// On session failure, dump where WebView2 actually wrote its files and
// whether the app is still alive — CI diagnosis without a desktop.
function dumpWindowsDiagnostics() {
  if (process.platform !== 'win32') return;
  const ps = (command) => {
    try {
      return spawnSync(
        'powershell',
        ['-NoProfile', '-NonInteractive', '-Command', command],
        { encoding: 'utf8', timeout: 30000 }
      ).stdout;
    } catch (e) {
      return `diagnostic failed: ${e}`;
    }
  };
  const appDir = path.dirname(getApplicationPath());
  // eslint-disable-next-line no-console
  console.error(
    'bruma.exe running:',
    ps(
      'Get-Process bruma -ErrorAction SilentlyContinue | Format-Table Id,ProcessName -AutoSize | Out-String'
    )
  );
  // eslint-disable-next-line no-console
  console.error(
    'DevToolsActivePort files:',
    ps(
      `Get-ChildItem -Path "${appDir}","$env:LOCALAPPDATA","$env:TEMP" -Recurse -Filter DevToolsActivePort -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName`
    )
  );
  // eslint-disable-next-line no-console
  console.error(
    'WebView2 data dirs:',
    ps(
      `Get-ChildItem -Path "${appDir}","$env:LOCALAPPDATA" -Recurse -Directory -Filter "*.WebView2" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName`
    )
  );
}

// Persisted settings may restore `viewMode: 'preview'` (Radix tabs leave the
// CodeMirror DOM unmounted when inactive). Force the editor tab when needed.
// Radix activates triggers on mousedown, so a bare el.click() via JS is not
// enough — prefer the trusted WebDriver click, fall back to a full sequence.
export async function ensureEditorView(driver) {
  const hasEditor = await driver.executeScript(
    'return Boolean(document.querySelector(".cm-content"));'
  );
  if (hasEditor) return;
  const tabs = await driver.findElements(
    By.css('button[role="tab"][id$="trigger-editor"]')
  );
  if (tabs.length === 0) return;
  try {
    await tabs[0].click();
  } catch {
    await driver.executeScript(
      `for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
        arguments[0].dispatchEvent(new MouseEvent(type, { bubbles: true }));
      }`,
      tabs[0]
    );
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

      const driverEnv = { ...process.env };
      // GTK3 probes XDG_RUNTIME_DIR/wayland-0 even without WAYLAND_DISPLAY and
      // would send the app to a foreign Wayland session. The harness uses
      // xclip + a real X display, so pin the app to the X11 backend.
      if (process.platform === 'linux' && driverEnv.DISPLAY) {
        driverEnv.GDK_BACKEND = 'x11';
        delete driverEnv.WAYLAND_DISPLAY;
      }

      tauriDriver = spawn(getTauriDriverPath(), [], {
        stdio: [null, process.stdout, process.stderr],
        shell: false,
        env: driverEnv,
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
        // Bruma doesn't set `data_directory`, so wry leaves WebView2's user
        // data folder at the default `<exedir>\<exe>.WebView2`. Pointing the
        // driver at the same place lets it find DevToolsActivePort.
        const userDataFolder = `${getApplicationPath()}.WebView2`;
        mkdirSync(userDataFolder, { recursive: true });
        tauriOptions.webviewOptions = {
          userDataFolder,
          // WebView2 only writes DevToolsActivePort when the browser process
          // gets this flag; pass it explicitly instead of relying on the
          // driver's injection.
          additionalBrowserArguments: ['--remote-debugging-port=0'],
        };
      }
      capabilities.set('tauri:options', tauriOptions);
      capabilities.setBrowserName('wry');

      try {
        driver = await new Builder()
          .withCapabilities(capabilities)
          .usingServer('http://127.0.0.1:4444/')
          .build();
      } catch (error) {
        dumpWindowsDiagnostics();
        throw error;
      }

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

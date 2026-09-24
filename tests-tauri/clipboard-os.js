import { spawnSync } from 'node:child_process';

const platform = process.platform;

// `capture` controls whether stdout/stderr are piped. Clipboard *writers*
// like `xclip -i` fork a daemon that inherits our stdio — piping them makes
// spawnSync wait forever, so writes run with output ignored.
function run(command, args, { input, capture = true, extraArgs = [] } = {}) {
  const result = spawnSync(command, [...extraArgs, ...args], {
    input,
    encoding: 'utf8',
    shell: false,
    timeout: 15000,
    stdio: capture ? ['pipe', 'pipe', 'pipe'] : ['pipe', 'ignore', 'ignore'],
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `${command} exited ${result.status}: ${result.stderr || result.stdout}`
    );
  }
  return result.stdout ?? '';
}

const PWSH = 'powershell';
const PWSH_ARGS = ['-NoProfile', '-NonInteractive', '-Command'];

export function clipboardAvailable() {
  try {
    if (platform === 'win32') {
      spawnSync(PWSH, ['-NoProfile', '-Command', 'exit 0'], {
        stdio: 'ignore',
      });
      return true;
    }
    if (platform === 'darwin') return true; // pbcopy/pbpaste ship with macOS
    if (platform === 'linux') {
      return (
        spawnSync('bash', ['-lc', 'command -v xclip'], { stdio: 'ignore' })
          .status === 0
      );
    }
  } catch {
    return false;
  }
  return false;
}

export function getClipboardText() {
  if (platform === 'win32') {
    return run(PWSH, ['Get-Clipboard -Raw'], { extraArgs: PWSH_ARGS }).replace(
      /\r?\n$/,
      ''
    );
  }
  if (platform === 'darwin') return run('pbpaste', []);
  return run('xclip', ['-selection', 'clipboard', '-o']);
}

export function setClipboardText(text) {
  if (platform === 'win32') {
    run(PWSH, ['$input | Set-Clipboard'], {
      extraArgs: PWSH_ARGS,
      input: text,
      capture: false,
    });
    return;
  }
  if (platform === 'darwin') {
    run('pbcopy', [], { input: text, capture: false });
    return;
  }
  run('xclip', ['-selection', 'clipboard', '-i'], {
    input: text,
    capture: false,
  });
}

// Clipboard formats currently offered. Windows exposes the CF_* names via
// Windows.Forms (needs STA); Linux exposes the X11 TARGETS atoms (text/html…).
export function getClipboardFormats() {
  if (platform === 'win32') {
    const out = run(
      PWSH,
      [
        'Add-Type -AssemblyName System.Windows.Forms; ' +
          '[System.Windows.Forms.Clipboard]::GetDataObject().GetFormats()',
      ],
      { extraArgs: ['-NoProfile', '-NonInteractive', '-STA', '-Command'] }
    );
    return out.split(/\r?\n/).filter(Boolean);
  }
  if (platform === 'darwin') {
    const out = run('osascript', ['-e', 'clipboard info']);
    return out.split(',').map((s) => s.trim());
  }
  return run('xclip', ['-selection', 'clipboard', '-t', 'TARGETS', '-o']).split(
    /\r?\n/
  );
}

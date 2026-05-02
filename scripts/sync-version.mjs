import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function readText(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

async function writeText(relativePath, content) {
  await writeFile(path.join(root, relativePath), content);
}

const checkOnly = process.argv.includes('--check');
const pendingWrites = [];

async function syncText(relativePath, content) {
  const current = await readText(relativePath);

  if (current === content) {
    return;
  }

  if (checkOnly) {
    pendingWrites.push(relativePath);
    return;
  }

  await writeText(relativePath, content);
}

function replaceRequired(content, pattern, replacement, file) {
  if (!pattern.test(content)) {
    throw new Error(`No se encontro el patron de version esperado en ${file}`);
  }

  return content.replace(pattern, replacement);
}

const packageJson = JSON.parse(await readText('package.json'));
const version = packageJson.version;

if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
  throw new Error(`Version invalida en package.json: ${version}`);
}

const tauriConfigPath = 'src-tauri/tauri.conf.json';
const tauriConfig = await readText(tauriConfigPath);
JSON.parse(tauriConfig);
await syncText(
  tauriConfigPath,
  replaceRequired(
    tauriConfig,
    /^  "version": ".*",$/m,
    `  "version": "${version}",`,
    tauriConfigPath
  )
);

const cargoTomlPath = 'src-tauri/Cargo.toml';
const cargoToml = await readText(cargoTomlPath);
await syncText(
  cargoTomlPath,
  replaceRequired(
    cargoToml,
    /^version = ".*"$/m,
    `version = "${version}"`,
    cargoTomlPath
  )
);

const cargoLockPath = 'src-tauri/Cargo.lock';
const cargoLock = await readText(cargoLockPath);
await syncText(
  cargoLockPath,
  replaceRequired(
    cargoLock,
    /(\[\[package\]\]\r?\nname = "bruma"\r?\nversion = ")[^"]+(")/,
    `$1${version}$2`,
    cargoLockPath
  )
);

if (pendingWrites.length > 0) {
  throw new Error(
    `Version desincronizada (${version}): ${pendingWrites.join(', ')}`
  );
}

console.log(
  checkOnly
    ? `Version sincronizada correctamente: ${version}`
    : `Version sincronizada: ${version}`
);

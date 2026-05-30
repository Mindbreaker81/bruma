import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const packageJson = JSON.parse(
  readFileSync(path.join(root, 'package.json'), 'utf8')
);
const version = packageJson.version;
const repository = process.env.GITHUB_REPOSITORY || 'Mindbreaker81/bruma';
const tag = process.env.RELEASE_TAG || `v${version}`;
const assetsDir = path.resolve(
  process.argv[2] || path.join(root, 'release-assets')
);
const outputPath = path.resolve(
  process.argv[3] || path.join(assetsDir, 'update.json')
);

function assetUrl(name) {
  return `https://github.com/${repository}/releases/download/${tag}/${encodeURIComponent(name)}`;
}

function readSignature(assetName) {
  const sigPath = path.join(assetsDir, `${assetName}.sig`);
  if (!existsSync(sigPath)) return null;
  return readFileSync(sigPath, 'utf8').trim();
}

function firstExisting(candidates) {
  return (
    candidates.find((name) => existsSync(path.join(assetsDir, name))) ?? null
  );
}

function notesFromChangelog() {
  const changelogPath = path.join(root, 'CHANGELOG.md');
  if (!existsSync(changelogPath)) return '';
  const changelog = readFileSync(changelogPath, 'utf8');
  const heading = new RegExp(
    `^## \[?v?${version.replaceAll('.', '\\.')}[^\n]*`,
    'm'
  );
  const match = heading.exec(changelog);
  if (!match) return '';
  const rest = changelog.slice(match.index + match[0].length);
  const next = rest.search(/^## /m);
  return (next >= 0 ? rest.slice(0, next) : rest).trim();
}

function fileSize(assetName) {
  const assetPath = path.join(assetsDir, assetName);
  if (!existsSync(assetPath)) return undefined;
  return statSync(assetPath).size;
}

const platformCandidates = {
  'darwin-aarch64': [
    `bruma-v${version}-macos-aarch64.app.tar.gz`,
    `bruma-v${version}-macos-aarch64.dmg`,
  ],
  'linux-x86_64': [
    `bruma-v${version}-linux-x86_64.AppImage`,
  ],
  'windows-x86_64': [
    `bruma-v${version}-windows-x64-setup.exe`,
    `bruma-v${version}-windows-x64-setup.msi`,
  ],
};

const platforms = {};
for (const [platform, candidates] of Object.entries(platformCandidates)) {
  const assetName = firstExisting(candidates);
  if (!assetName) continue;
  const signature = readSignature(assetName);
  const platformData = {
    url: assetUrl(assetName),
  };
  if (signature) {
    platformData.signature = signature;
  }
  const size = fileSize(assetName);
  if (size !== undefined) {
    platformData.size = size;
  }
  platforms[platform] = platformData;
}

if (Object.keys(platforms).length === 0) {
  const found = existsSync(assetsDir)
    ? readdirSync(assetsDir).join(', ')
    : 'directory missing';
  throw new Error(`No updater assets found in ${assetsDir}: ${found}`);
}

const manifest = {
  version,
  notes: process.env.RELEASE_NOTES || notesFromChangelog(),
  pub_date: process.env.RELEASE_PUB_DATE || new Date().toISOString(),
  platforms,
};

writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  `Wrote ${outputPath} with ${Object.keys(platforms).length} platform(s).`
);

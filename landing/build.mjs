import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const landingSrc = path.join(__dirname, 'src');
const distDir = path.join(__dirname, 'dist');

const readmePath = path.join(repoRoot, 'README.md');
const changelogPath = path.join(repoRoot, 'CHANGELOG.md');
const packagePath = path.join(repoRoot, 'package.json');
const templatePath = path.join(landingSrc, 'template.html');

function extractLatestChangelogMarkdown(changelogRaw) {
  const lines = changelogRaw.split(/\r?\n/);
  const starts = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (/^## \[[^\]]+\]/.test(lines[i])) {
      starts.push(i);
    }
  }
  if (starts.length === 0) {
    return changelogRaw.trim();
  }
  for (const start of starts) {
    const heading = lines[start];
    if (/^## \[Unreleased\]/.test(heading)) {
      continue;
    }
    const nextStart = starts.find((s) => s > start) ?? lines.length;
    return lines.slice(start, nextStart).join('\n').trim();
  }
  const first = starts[0];
  const nextStart = starts.find((s) => s > first) ?? lines.length;
  return lines.slice(first, nextStart).join('\n').trim();
}

function createMarkdownRenderer() {
  return new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
  }).use(anchor, {
    permalink: false,
  });
}

function escapeHtmlAttr(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function main() {
  const readmeRaw = fs.readFileSync(readmePath, 'utf8');
  const changelogRaw = fs.readFileSync(changelogPath, 'utf8');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const version = pkg.version ?? '0.0.0';
  const description = pkg.description ?? 'Editor Markdown de escritorio.';

  const md = createMarkdownRenderer();
  const readmeHtml = md.render(readmeRaw);
  const changelogHtml = md.render(changelogRaw);
  const latestChangelogMd = extractLatestChangelogMarkdown(changelogRaw);
  const latestChangelogHtml = md.render(latestChangelogMd);

  const now = new Date();
  const buildDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  let template = fs.readFileSync(templatePath, 'utf8');
  template = template
    .replaceAll('{{version}}', escapeHtmlAttr(version))
    .replaceAll('{{description}}', escapeHtmlAttr(description))
    .replaceAll('{{buildDate}}', escapeHtmlAttr(buildDate))
    .replaceAll('{{readmeHtml}}', readmeHtml)
    .replaceAll('{{changelogHtml}}', changelogHtml)
    .replaceAll('{{latestChangelogHtml}}', latestChangelogHtml);

  fs.mkdirSync(distDir, { recursive: true });
  fs.writeFileSync(path.join(distDir, 'index.html'), template, 'utf8');

  for (const file of ['styles.css', 'app.js', 'icon.svg', 'favicon.svg']) {
    fs.copyFileSync(path.join(landingSrc, file), path.join(distDir, file));
  }

  console.log('landing build ok → dist/');
}

main();

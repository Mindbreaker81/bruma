import { describe, expect, it } from 'vitest';

import { buildExportHtml } from './export';

describe('export html', () => {
  it('produces a complete document with title and embedded styles by default', () => {
    const html = buildExportHtml('# Hola', { title: 'Mi nota' });
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('<title>Mi nota</title>');
    expect(html).toContain('<style>');
    expect(html).toMatch(/<h1[^>]*>Hola<\/h1>/);
  });

  it('escapes the title to prevent injection', () => {
    const html = buildExportHtml('# x', { title: '"<script>"' });
    expect(html).toContain('&quot;&lt;script&gt;&quot;');
  });

  it('omits styles when includeStyles=false', () => {
    const html = buildExportHtml('# x', { includeStyles: false });
    expect(html).toContain('<style></style>');
  });
});

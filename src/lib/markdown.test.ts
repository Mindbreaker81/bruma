import { describe, expect, it } from 'vitest';

import {
  renderMarkdown,
  renderSafeMarkdown,
  sanitizeMarkdownHtml,
} from './markdown';

describe('markdown rendering', () => {
  it('renders markdown fixtures deterministically', () => {
    const html = renderSafeMarkdown(
      [
        '# Bruma',
        '',
        '- [x] listo',
        '- [ ] pendiente',
        '',
        '| A | B |',
        '| - | - |',
        '| 1 | 2 |',
        '',
        '```ts',
        'const value = 1;',
        '```',
      ].join('\n')
    );

    expect(html).toContain('<h1>Bruma</h1>');
    expect(html).toContain('<table>');
    expect(html).toContain('contains-task-list');
    expect(html).toContain('language-ts');
  });

  it('keeps raw markdown rendering separate from sanitization', () => {
    expect(renderMarkdown('**Bruma**')).toContain('<strong>Bruma</strong>');
  });

  it('removes script tags, event handlers and javascript URLs', () => {
    const html = sanitizeMarkdownHtml(
      '<p onclick="alert(1)">x</p><script>alert(1)</script><a href="javascript:alert(1)">bad</a>'
    );

    expect(html).toContain('<p>x</p>');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('onclick');
    expect(html).not.toContain('javascript:');
  });
});

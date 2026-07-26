import { describe, expect, it, vi } from 'vitest';

import { resolveLocalImages } from './images';

describe('local images', () => {
  it('embeds relative images and preserves remote images', async () => {
    const resolver = vi.fn(async (_base: string, source: string) =>
      source === 'photo.png' ? 'data:image/png;base64,abc' : null
    );

    const html = await resolveLocalImages(
      '<p><img src="photo.png"><img src="https://example.com/a.png"></p>',
      '/notes/note.md',
      resolver
    );

    expect(html).toContain('src="data:image/png;base64,abc"');
    expect(html).toContain('src="https://example.com/a.png"');
    expect(resolver).toHaveBeenCalledOnce();
  });

  it('leaves HTML unchanged without a document path', async () => {
    const resolver = vi.fn();
    const html = '<img src="photo.png">';

    await expect(resolveLocalImages(html, null, resolver)).resolves.toBe(html);
    expect(resolver).not.toHaveBeenCalled();
  });
});

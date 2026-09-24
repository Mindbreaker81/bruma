import { describe, expect, it, vi } from 'vitest';

import {
  fileToBase64,
  imageExtensionForFile,
  resolveLocalImages,
} from './images';

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

describe('pasted images', () => {
  it('maps mime types to extensions', () => {
    expect(
      imageExtensionForFile(new File([], 'shot', { type: 'image/png' }))
    ).toBe('png');
    expect(
      imageExtensionForFile(new File([], 'shot', { type: 'image/jpeg' }))
    ).toBe('jpg');
    expect(
      imageExtensionForFile(new File([], 'shot', { type: 'image/webp' }))
    ).toBe('webp');
  });

  it('falls back to the file name extension or png', () => {
    expect(
      imageExtensionForFile(new File([], 'captura.GIF', { type: '' }))
    ).toBe('gif');
    expect(imageExtensionForFile(new File([], 'blob', { type: '' }))).toBe(
      'png'
    );
  });

  it('encodes file contents as base64', async () => {
    const file = new File([new Uint8Array([104, 105])], 'a.png', {
      type: 'image/png',
    });
    await expect(fileToBase64(file)).resolves.toBe('aGk=');
  });
});

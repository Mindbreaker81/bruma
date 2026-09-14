import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  canReadClipboard,
  canWriteClipboard,
  readClipboardText,
  writeClipboardHtml,
  writeClipboardText,
} from './clipboard';

function stubClipboard(value: unknown) {
  Object.defineProperty(window.navigator, 'clipboard', {
    configurable: true,
    value,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('canReadClipboard / canWriteClipboard', () => {
  it('devuelven false cuando la API de portapapeles no existe', () => {
    stubClipboard(undefined);

    expect(canReadClipboard()).toBe(false);
    expect(canWriteClipboard()).toBe(false);
  });

  it('devuelven true cuando los métodos existen', () => {
    stubClipboard({
      readText: vi.fn(),
      writeText: vi.fn(),
    });

    expect(canReadClipboard()).toBe(true);
    expect(canWriteClipboard()).toBe(true);
  });
});

describe('readClipboardText', () => {
  it('devuelve null cuando navigator.clipboard no existe', async () => {
    stubClipboard(undefined);

    await expect(readClipboardText()).resolves.toBeNull();
  });

  it('devuelve null cuando readText rechaza por permisos', async () => {
    stubClipboard({ readText: vi.fn().mockRejectedValue(new Error('denied')) });

    await expect(readClipboardText()).resolves.toBeNull();
  });

  it('devuelve el texto del portapapeles', async () => {
    stubClipboard({ readText: vi.fn().mockResolvedValue('hola') });

    await expect(readClipboardText()).resolves.toBe('hola');
  });
});

describe('writeClipboardText', () => {
  it('devuelve false cuando la API no existe', async () => {
    stubClipboard(undefined);

    await expect(writeClipboardText('x')).resolves.toBe(false);
  });

  it('devuelve false cuando writeText rechaza', async () => {
    stubClipboard({
      writeText: vi.fn().mockRejectedValue(new Error('denied')),
    });

    await expect(writeClipboardText('x')).resolves.toBe(false);
  });

  it('escribe el texto y devuelve true', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard({ writeText });

    await expect(writeClipboardText('hola')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('hola');
  });
});

describe('writeClipboardHtml', () => {
  it('cae a writeText cuando ClipboardItem no está definido', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard({ writeText });
    vi.stubGlobal('ClipboardItem', undefined);

    await expect(writeClipboardHtml('<b>hola</b>', 'hola')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('hola');
  });

  it('cae a writeText cuando clipboard.write rechaza', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const write = vi.fn().mockRejectedValue(new Error('denied'));
    stubClipboard({ write, writeText });
    vi.stubGlobal(
      'ClipboardItem',
      class {
        constructor(public items: unknown) {}
      }
    );

    await expect(writeClipboardHtml('<b>hola</b>', 'hola')).resolves.toBe(true);
    expect(write).toHaveBeenCalled();
    expect(writeText).toHaveBeenCalledWith('hola');
  });

  it('escribe HTML y texto plano cuando la API lo permite', async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    stubClipboard({ write });
    vi.stubGlobal(
      'ClipboardItem',
      class {
        constructor(public items: unknown) {}
      }
    );

    await expect(writeClipboardHtml('<b>hola</b>', 'hola')).resolves.toBe(true);
    expect(write).toHaveBeenCalledTimes(1);
  });
});

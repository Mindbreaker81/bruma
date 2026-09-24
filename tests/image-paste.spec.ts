import { expect, test } from '@playwright/test';

// NOTE: Chromium has no real Tauri backend — `window.__TAURI_INTERNALS__` is
// stubbed so IPC wrappers take the live path and `open_file_dialog` /
// `save_pasted_image` resolve with canned responses.

const stubTauriInternals = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    const callbacks = new Map<number, (data: unknown) => void>();
    let nextId = 0;

    (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {
      invoke: (cmd: string) => {
        if (cmd === 'open_file_dialog') {
          return Promise.resolve({
            path: '/tmp/doc.md',
            content: 'contenido previo',
            eol: 'lf',
          });
        }
        if (cmd === 'save_pasted_image') {
          return Promise.resolve({
            path: '/tmp/imagen-1.png',
            fileName: 'imagen-1.png',
          });
        }
        return Promise.resolve(null);
      },
      transformCallback: (cb: (data: unknown) => void) => {
        const id = nextId;
        nextId += 1;
        callbacks.set(id, cb);
        return id;
      },
      metadata: {
        currentWindow: { label: 'main' },
        currentWebview: { label: 'main' },
      },
    };
  });
};

const pasteImageFile = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const data = new DataTransfer();
    data.items.add(
      new File([new Uint8Array([137, 80, 78, 71])], 'clip.png', {
        type: 'image/png',
      })
    );
    const event = new ClipboardEvent('paste', {
      clipboardData: data,
      bubbles: true,
      cancelable: true,
    });
    document.querySelector('.bruma-editor')?.dispatchEvent(event);
  });

const editorLocator = (page: import('@playwright/test').Page) =>
  page.getByRole('textbox', { name: /Editor Markdown|Markdown editor/i });

test('pasting an image in an unsaved document asks to save first', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: /Start writing|Empezar a escribir/i })
    .click();

  await pasteImageFile(page);

  await expect(
    page.getByText(
      /Guarda el documento antes de pegar|Save the document before pasting/i
    )
  ).toBeVisible();
});

test('pasting an image in a saved document inserts a markdown reference', async ({
  page,
}) => {
  await stubTauriInternals(page);
  await page.goto('/');
  await page
    .getByRole('button', { name: /Abrir documento|Open document/i })
    .click();

  const editor = editorLocator(page);
  await editor.click();
  await expect(editor).toBeFocused();

  await pasteImageFile(page);

  await expect(editor).toContainText('![](imagen-1.png)');
});

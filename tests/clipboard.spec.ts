import { expect, test } from '@playwright/test';

// NOTE: these tests run against the web build in Chromium — they do not
// exercise the native menus of macOS/Windows/Linux. Native menu behaviour
// (accelerators, predefined items) is verified manually per the V1–V9 matrix.

test.beforeEach(async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page
    .getByRole('button', { name: /Start writing|Empezar a escribir/i })
    .click();
});

const editorLocator = (page: import('@playwright/test').Page) =>
  page.getByRole('textbox', { name: /Editor Markdown|Markdown editor/i });

// Focus the editor and wait until CodeMirror's contenteditable really owns
// DOM focus — typing before that loses keystrokes (flaky `****` in CI).
const focusEditor = async (page: import('@playwright/test').Page) => {
  const editor = editorLocator(page);
  await editor.click();
  await expect(editor).toBeFocused();
  return editor;
};

test('clipboard buttons are present and accessible', async ({ page }) => {
  await expect(
    page.getByRole('button', { name: /^Cortar|^Cut/ })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /^Copiar|^Copy/ })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /^Pegar|^Paste/ })
  ).toBeVisible();
});

test('copy button writes the selection to the system clipboard', async ({
  page,
}) => {
  await focusEditor(page);
  await page.keyboard.type('hola mundo');
  await page.keyboard.press('ControlOrMeta+a');

  await page.getByRole('button', { name: /^Copiar|^Copy/ }).click();

  const clipboardText = await page.evaluate(() =>
    navigator.clipboard.readText()
  );
  expect(clipboardText).toBe('hola mundo');
});

test('paste button replaces the selection with the clipboard text', async ({
  page,
}) => {
  const editor = await focusEditor(page);
  await page.keyboard.type('texto inicial');
  await page.keyboard.press('ControlOrMeta+a');

  await page.evaluate(() =>
    navigator.clipboard.writeText('desde portapapeles')
  );
  await page.getByRole('button', { name: /^Pegar|^Paste/ }).click();

  await expect(editor).toContainText('desde portapapeles');
  await expect(editor).not.toContainText('texto inicial');
});

test('right click on the editor shows the app context menu', async ({
  page,
}) => {
  const editor = editorLocator(page);
  await editor.click({ button: 'right' });

  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  await expect(
    menu.getByRole('menuitem', { name: /Pegar|Paste/ })
  ).toBeVisible();
  await expect(
    menu.getByRole('menuitem', { name: /Seleccionar todo|Select all/ })
  ).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
});

test('preview context menu copies the selection even if it collapses', async ({
  page,
}) => {
  const editor = await focusEditor(page);
  await page.keyboard.type('texto de prueba preview');
  await expect(editor).toContainText('texto de prueba preview');

  await page.getByRole('tab', { name: /^Preview$|^Vista previa$/i }).click();

  const preview = page.getByRole('article', {
    name: /Markdown preview|Vista previa/i,
  });
  await expect(preview).toContainText('texto de prueba preview');

  await page.evaluate(() => {
    const el = document.querySelector('.bruma-preview');
    const range = document.createRange();
    range.selectNodeContents(el!);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  });

  // Raw mouse events: locator.click({button:'right'}) can race the menu.
  const box = (await preview.boundingBox())!;
  await page.mouse.move(box.x + 100, box.y + 30);
  await page.mouse.down({ button: 'right' });
  await page.mouse.up({ button: 'right' });
  await expect(page.getByRole('menu')).toBeVisible();

  // WKWebView collapses the DOM selection when the menu takes focus.
  await page.evaluate(() => window.getSelection()?.removeAllRanges());

  await page
    .getByRole('menuitem', { name: /Copiar selección|Copy selection/i })
    .click({ force: true });

  const clipboardText = await page.evaluate(() =>
    navigator.clipboard.readText()
  );
  expect(clipboardText).toContain('texto de prueba preview');
});

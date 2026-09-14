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
  const editor = editorLocator(page);
  await editor.click();
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
  const editor = editorLocator(page);
  await editor.click();
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

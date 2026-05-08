import { expect, test } from '@playwright/test';

test('format toolbar inserts and toggles markdown syntax', async ({
  page,
}) => {
  await page.goto('/');

  // Dismiss welcome state to reveal the editor.
  await page
    .getByRole('button', { name: /Start writing|Empezar a escribir/i })
    .click();

  const editor = page.getByRole('textbox', {
    name: /Editor Markdown|Markdown editor/i,
  });
  await expect(editor).toBeVisible();

  // Bold via toolbar wraps the selected text.
  await editor.click();
  await page.keyboard.press('Meta+a');
  await page.keyboard.type('hola mundo');
  await page.keyboard.press('Meta+a');

  await page.getByRole('button', { name: /^Negrita|^Bold/ }).click();
  await expect(editor).toContainText('**hola mundo**');

  // Heading 1 via toolbar toggles a prefix on the current line.
  await page.keyboard.press('Meta+a');
  await page.keyboard.type('Título de prueba');
  await page.keyboard.press('Home');
  await page
    .getByRole('button', { name: /^Título 1|^Heading 1/ })
    .first()
    .click();
  await expect(editor).toContainText('# Título de prueba');

  // Markdown guide opens, an example is clickable, and inserts into editor.
  await page.getByRole('button', { name: /Guía Markdown|Markdown guide/ }).click();
  const guide = page.getByRole('dialog', {
    name: /Guía rápida|quick guide/i,
  });
  await expect(guide).toBeVisible();
  await guide.getByRole('button', { name: /\*\*negrita\*\*/ }).click();
  await expect(guide).toBeHidden();
  await expect(editor).toContainText('**');
});

test('Enter on a list item continues the list, Enter on empty exits', async ({
  page,
}) => {
  await page.goto('/');

  await page
    .getByRole('button', { name: /Start writing|Empezar a escribir/i })
    .click();

  const editor = page.getByRole('textbox', {
    name: /Editor Markdown|Markdown editor/i,
  });
  await editor.click();
  await page.keyboard.press('Meta+a');

  await page.keyboard.type('- alpha');
  await page.keyboard.press('Enter');
  await page.keyboard.type('beta');
  await expect(editor).toContainText('- alpha');
  await expect(editor).toContainText('- beta');

  // Enter on the now-current line, then Enter again on the empty marker exits.
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.type('plain');
  await expect(editor).toContainText('plain');
});

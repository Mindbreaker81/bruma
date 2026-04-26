import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('shows the Bruma shell', async ({ page }) => {
  await page.goto('/');

  const editor = page.getByRole('textbox', {
    name: /Editor Markdown|Markdown editor/i,
  });
  const fixture = readFileSync(resolve('tests/fixtures/search.md'), 'utf8');

  await expect(page.getByRole('heading', { name: 'Bruma' })).toBeVisible();
  await expect(editor).toBeVisible();

  const dataTransfer = await page.evaluateHandle((content) => {
    const data = new DataTransfer();
    data.items.add(
      new File([content], 'search.md', {
        type: 'text/markdown',
      })
    );

    return data;
  }, fixture);

  await page.locator('main').dispatchEvent('drop', { dataTransfer });
  await expect(page.locator('footer').getByText('search.md')).toBeVisible();

  await page.getByRole('button', { name: /Dividido|Split/i }).click();

  await expect(page.getByRole('article', { name: /preview/i })).toContainText(
    'Bruma'
  );

  await page.getByRole('button', { name: /Buscar|Search/i }).click();
  await page
    .getByLabel(/Buscar en el documento|Search document/i)
    .fill('bruma');

  await expect(page.getByText('1/2')).toBeVisible();

  await page
    .getByRole('button', { name: /Distinguir mayúsculas|Match case/i })
    .click();

  await expect(page.getByText('0/0')).toBeVisible();

  await page.keyboard.press('Escape');

  await expect(
    page.getByLabel(/Buscar en el documento|Search document/i)
  ).toBeHidden();

  await editor.fill('# Cambio sin guardar');
  await expect(page.getByText(/^(Sin guardar|Unsaved)$/i)).toBeVisible();

  await page
    .getByRole('button', { name: /Nuevo documento|New document/i })
    .click();

  await expect(
    page.getByRole('dialog', { name: /Cambios sin guardar|Unsaved changes/i })
  ).toBeVisible();

  await page.getByRole('button', { name: /Descartar|Discard/i }).click();

  await expect(
    page.locator('footer').getByText(/Sin titulo|Untitled/i)
  ).toBeVisible();

  await page
    .getByRole('button', { name: /Archivos recientes|Recent files/i })
    .click();

  await expect(page.getByRole('button', { name: 'search.md' })).toBeVisible();
});

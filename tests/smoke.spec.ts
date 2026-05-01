import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('shows the Bruma shell', async ({ page }) => {
  await page.goto('/');

  const fixture = readFileSync(resolve('tests/fixtures/search.md'), 'utf8');

  await expect(page.getByRole('heading', { name: 'Bruma' })).toBeVisible();

  // Dismiss welcome state to reveal the editor
  await page
    .getByRole('button', { name: /Start writing|Empezar a escribir/i })
    .click();

  const editor = page.getByRole('textbox', {
    name: /Editor Markdown|Markdown editor/i,
  });
  await expect(editor).toBeVisible();

  // Switch language via toolbar
  await page
    .getByRole('button', { name: /Change language|Cambiar idioma/i })
    .click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');

  // Drop a file
  const dataTransfer = await page.evaluateHandle((content) => {
    const data = new DataTransfer();
    data.items.add(
      new File([content], 'search.md', {
        type: 'text/markdown',
      })
    );

    return data;
  }, fixture);

  await page.locator('.bruma-shell').dispatchEvent('drop', { dataTransfer });
  await expect(page.locator('footer').getByText('search.md')).toBeVisible();

  // Cycle view mode from editor → split
  await page
    .getByRole('button', { name: /Change view mode|Cambiar modo de vista/i })
    .click();

  const preview = page.getByRole('article', {
    name: /Markdown preview|Vista previa/i,
  });
  await expect(preview).toBeVisible({ timeout: 10000 });
  await expect(preview).toContainText('Bruma');

  // Open search
  await page.getByRole('button', { name: /^Buscar$|^Search$/ }).click();
  await page
    .getByPlaceholder(/Search|Buscar/)
    .first()
    .fill('bruma');

  await expect(page.getByText('1 / 2')).toBeVisible();

  await page
    .getByRole('button', { name: /Match case|Distinguir mayúsculas/i })
    .click();

  await expect(page.getByText('0/0')).toBeVisible();

  await page.keyboard.press('Escape');

  await expect(page.getByRole('search')).toBeHidden();

  await editor.click();
  await page.keyboard.press('Meta+a');
  await page.keyboard.type('# Cambio sin guardar');
  await expect(page.getByText(/^(Sin guardar|Unsaved)$/i)).toBeVisible();

  // New document triggers unsaved changes dialog
  await page
    .locator(
      'button[aria-label="New document"], button[aria-label="Nuevo documento"]'
    )
    .click();
  await page.getByRole('menuitem', { name: /Empty note|Nota vacía/i }).click();

  await expect(
    page.getByRole('alertdialog', {
      name: /Cambios sin guardar|Unsaved changes/i,
    })
  ).toBeVisible();

  await page.getByRole('button', { name: /Descartar|Discard/i }).click();

  await expect(
    page.locator('footer').getByText(/Sin titulo|Untitled/i)
  ).toBeVisible();

  // Open recent files
  await page
    .locator(
      'button[aria-label*="Recent files"], button[aria-label*="Archivos recientes"]'
    )
    .click();

  await expect(page.getByRole('menuitem', { name: 'search.md' })).toBeVisible();
});

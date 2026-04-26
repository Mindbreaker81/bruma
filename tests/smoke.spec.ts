import { expect, test } from '@playwright/test';

test('shows the Bruma shell', async ({ page }) => {
  await page.goto('/');

  const editor = page.getByLabel(/Markdown/i);

  await expect(page.getByRole('heading', { name: 'Bruma' })).toBeVisible();
  await expect(editor).toBeVisible();

  await editor.fill('# Bruma');

  await expect(page.getByText(/^(Sin guardar|Unsaved)$/i)).toBeVisible();
});

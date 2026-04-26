import { expect, test } from '@playwright/test';

test('shows the Bruma shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Bruma' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: /Markdown/i })).toBeVisible();
});

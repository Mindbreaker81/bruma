import { expect, test } from '@playwright/test';

test('Welcome state — light', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('theme', 'light'));
  await page.reload();
  await expect(page).toHaveScreenshot('welcome-light.png', {
    maxDiffPixelRatio: 0.01,
  });
});

test('Welcome state — dark', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('theme', 'dark'));
  await page.reload();
  await expect(page).toHaveScreenshot('welcome-dark.png', {
    maxDiffPixelRatio: 0.01,
  });
});

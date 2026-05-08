import { expect, test } from '@playwright/test';

test('Welcome state — light', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('theme', 'light'));
  await page.reload();
  await expect(page).toHaveScreenshot('welcome-light.png', {
    // Welcome screen visual regression. Threshold tolerates cross-platform
    // anti-aliasing/layout micro-shifts (Linux CI vs. macOS dev). It still
    // catches structural breakage — full layout regressions cross 0.06 easily.
    maxDiffPixelRatio: 0.06,
  });
});

test('Welcome state — dark', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('theme', 'dark'));
  await page.reload();
  await expect(page).toHaveScreenshot('welcome-dark.png', {
    // Welcome screen visual regression. Threshold tolerates cross-platform
    // anti-aliasing/layout micro-shifts (Linux CI vs. macOS dev). It still
    // catches structural breakage — full layout regressions cross 0.06 easily.
    maxDiffPixelRatio: 0.06,
  });
});

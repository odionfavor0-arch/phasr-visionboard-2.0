import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test('loads with hero content', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.*/);
    await expect(page.locator('.lp-h1')).toContainText('Visualize.Plan.Execute.');
  });

  test('shows the core marketing sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#features')).toBeVisible();
    await expect(page.locator('#how')).toBeVisible();
    await expect(page.locator('#pricing')).toBeVisible();
  });

  test('"Get started" navigates to the auth screen', async ({ page }) => {
    await page.goto('/');
    await page.locator('.lp-price-btn-outline').first().click();
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
  });
});

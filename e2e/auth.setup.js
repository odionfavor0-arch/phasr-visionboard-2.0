import { test as setup, expect } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';
const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;

setup('authenticate', async ({ page }) => {
  setup.skip(!email || !password, 'Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run authenticated specs.');

  await page.goto('/');
  await page.locator('.lp-price-btn-outline').first().click();
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();

  // Skip onboarding for this run so authenticated specs land on the app shell, not the wizard.
  await page.evaluate(() => localStorage.setItem('phasr_onboarded', 'true'));

  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('Your password').fill(password);
  await page.getByRole('button', { name: 'Sign In ->' }).click();

  await expect(page.getByRole('button', { name: 'Vision Board' })).toBeVisible({ timeout: 15000 });

  await page.context().storageState({ path: authFile });
});

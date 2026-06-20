import { test, expect } from '@playwright/test';

test('Settings view loads', async ({ page }) => {
  test.skip(!process.env.E2E_TEST_EMAIL || !process.env.E2E_TEST_PASSWORD, 'Set E2E_TEST_EMAIL/E2E_TEST_PASSWORD to run authenticated specs.');
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByText('Settings').first()).toBeVisible();
});

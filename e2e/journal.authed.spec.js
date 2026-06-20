import { test, expect } from '@playwright/test';

test('Journal view loads', async ({ page }) => {
  test.skip(!process.env.E2E_TEST_EMAIL || !process.env.E2E_TEST_PASSWORD, 'Set E2E_TEST_EMAIL/E2E_TEST_PASSWORD to run authenticated specs.');
  await page.goto('/');
  await page.getByRole('button', { name: 'Journal' }).click();
  await expect(page.getByText(/Journal/i).first()).toBeVisible();
});

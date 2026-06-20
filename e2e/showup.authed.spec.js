import { test, expect } from '@playwright/test';

test('Show Up view loads without errors', async ({ page }) => {
  test.skip(!process.env.E2E_TEST_EMAIL || !process.env.E2E_TEST_PASSWORD, 'Set E2E_TEST_EMAIL/E2E_TEST_PASSWORD to run authenticated specs.');
  await page.goto('/');
  await page.getByRole('button', { name: 'Show Up' }).click();
  await expect(page.locator('body')).not.toContainText('Something went wrong');
});

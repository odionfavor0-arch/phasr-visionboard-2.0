import { test, expect } from '@playwright/test';

test('Vision Board is the default authenticated view', async ({ page }) => {
  test.skip(!process.env.E2E_TEST_EMAIL || !process.env.E2E_TEST_PASSWORD, 'Set E2E_TEST_EMAIL/E2E_TEST_PASSWORD to run authenticated specs.');
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Vision Board' })).toBeVisible();
  await expect(page.getByText('My Vision Board')).toBeVisible();
});

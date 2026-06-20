import { test, expect } from '@playwright/test';

test.describe('Auth page (UI only, no real Supabase submission)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('.lp-price-btn-outline').first().click();
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
  });

  test('defaults to sign in mode', async ({ page }) => {
    await expect(page.getByPlaceholder('Your name')).toHaveCount(0);
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('Your password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In ->' })).toBeVisible();
  });

  test('switching to sign up reveals the name field', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
    await expect(page.getByPlaceholder('Your name')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Free Account ->' })).toBeVisible();
  });

  test('shows the Google sign-in option and forgot password link', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
    await expect(page.getByText('Forgot password?')).toBeVisible();
  });

  test('forgot password without an email shows a warning', async ({ page }) => {
    await page.getByText('Forgot password?').click();
    await expect(page.getByText('Warning: Enter your email first.')).toBeVisible();
  });
});

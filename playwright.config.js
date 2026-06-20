import { defineConfig, devices } from '@playwright/test';

const hasE2EAuth = Boolean(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: 2,
  retries: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30000,
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.js/ },
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: [/auth\.setup\.js/, /\.authed\.spec\.js/] },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testIgnore: [/auth\.setup\.js/, /\.authed\.spec\.js/] },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, testIgnore: [/auth\.setup\.js/, /\.authed\.spec\.js/] },
    {
      name: 'chromium-authenticated',
      use: { ...devices['Desktop Chrome'], storageState: hasE2EAuth ? 'e2e/.auth/user.json' : undefined },
      testMatch: /\.authed\.spec\.js/,
      dependencies: ['setup'],
    },
  ],
});

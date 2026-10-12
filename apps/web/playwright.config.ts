import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: `http://localhost:${PORT}/biblical-history-database/`, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: { command: `pnpm exec astro preview --port ${PORT}`, port: PORT, reuseExistingServer: !process.env.CI, timeout: 60_000 },
});

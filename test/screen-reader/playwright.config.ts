import { defineConfig, devices } from '@playwright/test';
import { screenReaderConfig } from '@guidepup/playwright';

const BASE_URL = 'http://localhost:5173';

export default defineConfig({
  ...screenReaderConfig,
  outputDir: '../../test-results/screen-reader',
  testDir: '.',
  testMatch: '*.spec.ts',
  timeout: 60_000,
  use: {
    ...screenReaderConfig.use,
    baseURL: BASE_URL,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: process.env.CI ? 'chrome' : undefined,
      },
    },
  ],
  webServer: {
    command: 'pnpm test:e2e:dev',
    cwd: process.cwd(),
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: BASE_URL,
  },
});

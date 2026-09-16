import { defineConfig, devices } from '@playwright/test';
import { screenReaderConfig } from '@guidepup/playwright';

// The fixture server's port, overridable for a machine where another server holds the default:
// `reuseExistingServer` would otherwise adopt it and run every spec against the wrong app.
const PORT = process.env.SCREEN_READER_PORT || '5173';
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  ...screenReaderConfig,
  outputDir: '../../test-results/screen-reader',
  testDir: '.',
  testMatch: '*.spec.ts',
  timeout: 5 * 60_000,
  retries: 1,
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
    command: `pnpm exec vite --config test/e2e/vite.config.mjs -l info --port ${PORT}`,
    cwd: process.cwd(),
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: BASE_URL,
  },
});

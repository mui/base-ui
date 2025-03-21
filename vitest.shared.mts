import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type UserWorkspaceConfig } from 'vitest/config';

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = resolve(CURRENT_DIR, './');
const environment = process.env.VITEST_ENV;

type BrowserModeConfig = (UserWorkspaceConfig['test'] & {})['browser'];

function getBrowserInstances() {
  const supportedBrowsers = ['chromium', 'firefox', 'webkit'];

  if (environment === 'all-browsers') {
    return supportedBrowsers.map((browser) => ({ browser }));
  }

  if (environment && supportedBrowsers.includes(environment)) {
    return [{ browser: environment }];
  }

  return [];
}

const browserConfig: BrowserModeConfig =
  environment === 'chromium' || environment === 'firefox' || environment === 'all-browsers'
    ? {
        enabled: true,
        provider: 'playwright',
        instances: getBrowserInstances(),
        headless: !!process.env.CI || environment === 'all-browsers',
        screenshotFailures: false,
      }
    : undefined;

const config: UserWorkspaceConfig = {
  test: {
    exclude: ['node_modules', 'build', '**/*.spec.*'],
    globals: true,
    setupFiles: [resolve(WORKSPACE_ROOT, './test/setupVitest.ts')],
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        pretendToBeVisual: true,
        url: 'http://localhost',
      },
    },
    browser: browserConfig,
    env: {
      VITEST: 'true',
    },
  },
  resolve: {
    alias: {
      docs: resolve(WORKSPACE_ROOT, './docs'),
    },
  },
};

export default config;

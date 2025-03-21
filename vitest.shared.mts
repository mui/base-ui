import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type UserWorkspaceConfig } from 'vitest/config';

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = resolve(CURRENT_DIR, './');
const environment = process.env.VITEST_ENV;

type BrowserModeConfig = (UserWorkspaceConfig['test'] & {})['browser'];

const supportedBrowsers = ['chromium', 'firefox', 'webkit'];

function getBrowserConfig(): BrowserModeConfig {
  if (
    !!environment &&
    (supportedBrowsers.includes(environment) || environment === 'all-browsers')
  ) {
    const commonConfig = {
      enabled: true,
      provider: 'playwright',
      screenshotFailures: false,
    };

    if (environment === 'all-browsers') {
      return {
        ...commonConfig,
        headless: true,
        instances: supportedBrowsers.map((browser) => ({ browser })),
      };
    }

    // "Headful" WebKit on Windows is not usable.
    const isWebKitOnWindows = environment === 'webkit' && process.platform === 'win32';

    if (supportedBrowsers.includes(environment)) {
      return {
        ...commonConfig,
        headless: !!process.env.CI || isWebKitOnWindows,
        instances: [{ browser: environment }],
      };
    }
  }

  return undefined;
}

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
    browser: getBrowserConfig(),
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

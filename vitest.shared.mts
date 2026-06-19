import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type UserWorkspaceConfig } from 'vitest/config';
// eslint-disable-next-line import/extensions
import viteConfig from '@base-ui/monorepo-tests/vite.shared.config.mjs';
import { playwright } from '@vitest/browser-playwright';

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = resolve(CURRENT_DIR, './');
const environment = process.env.VITEST_ENV;

type BrowserModeConfig = (UserWorkspaceConfig['test'] & {})['browser'];

const supportedBrowsers = new Set(['chromium', 'webkit', 'firefox'] as const);
type SupportedBrowser = typeof supportedBrowsers extends Set<infer U> ? U : never;

function isSupportedBrowser(env: string | undefined): env is SupportedBrowser {
  return !!env && (supportedBrowsers as Set<string>).has(env);
}

function getBrowserConfig(): BrowserModeConfig {
  if (!environment) {
    return undefined;
  }

  let instances;

  if (environment === 'all-browsers') {
    instances = Array.from(supportedBrowsers, (browser) => ({ browser }));
  } else if (isSupportedBrowser(environment)) {
    instances = [{ browser: environment }];
  } else {
    return undefined;
  }

  return {
    enabled: true,
    provider: playwright(),
    screenshotFailures: false,
    headless: true,
    instances,
  };
}

const browserConfig = getBrowserConfig();

// Browser mode drives real user interactions, so a handful of hover/timing tests are flaky under
// load; allow an extra retry there on CI. (Local runs never retry to keep results honest.)
const ciRetry = browserConfig ? 2 : 1;
const retry = process.env.CI ? ciRetry : 0;

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
    // Avoid committing tests that influence their own retry.
    retry,
  },
  resolve: viteConfig.resolve,
};

export default config;

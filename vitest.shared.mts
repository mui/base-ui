import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type UserWorkspaceConfig } from 'vitest/config';

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = resolve(CURRENT_DIR, './');
const environment = process.env.VITEST_ENV;

type ProjectConfig = UserWorkspaceConfig['test'] & {};

const browserConfig: ProjectConfig['browser'] =
  environment === 'chromium' || environment === 'firefox'
    ? {
        enabled: true,
        name: environment,
        provider: 'playwright',
        headless: !!process.env.CI,
        viewport: {
          width: 1024,
          height: 896,
        },
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

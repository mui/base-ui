import * as path from 'node:path';
import { type UserWorkspaceConfig } from 'vitest/config';

const WORKSPACE_ROOT = path.resolve(__dirname, './');

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
    setupFiles: [path.resolve(WORKSPACE_ROOT, './test/setupVitest.ts')],
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
      '@base_ui/react': path.resolve(WORKSPACE_ROOT, './packages/mui-base/src'),
      docs: path.resolve(WORKSPACE_ROOT, './docs'),
    },
  },
};

export default config;

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = resolve(CURRENT_DIR, './');
const CI = process.env.CI === 'true';

export default defineConfig({
  test: {
    reporters: ['basic'],
    coverage: {
      provider: 'v8',
      reporter: [['text', { maxCols: 200 }], 'lcov'],
      reportsDirectory: resolve(WORKSPACE_ROOT, 'coverage'),
      include: ['packages/*/src/**/*.ts', 'packages/*/src/**/*.tsx'],
      exclude: ['**/*.test.{js,ts,tsx}', '**/*.test/*'],
    },
    sequence: {
      hooks: 'list',
    },
    env: {
      MUI_VITEST: 'true',
    },
    pool: 'forks',
    poolOptions: {
      forks: {
        minForks: CI ? 2 : undefined,
        maxForks: CI ? 2 : undefined,
      },
    },
  },
});

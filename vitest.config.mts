import path from 'path';
import { defineConfig } from 'vitest/config';

const WORKSPACE_ROOT = path.resolve(__dirname, './');
const CI = process.env.CI === 'true';
const VITEST_MAX_THREADS = process.env.VITEST_MAX_THREADS;

export default defineConfig({
  test: {
    reporters: ['basic'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: path.resolve(WORKSPACE_ROOT, 'coverage'),
      include: ['packages/*/src/**/*.ts', 'packages/*/src/**/*.tsx'],
    },
    sequence: {
      hooks: 'list',
    },
    env: {
      MUI_VITEST: 'true',
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        useAtomics: true,
        minThreads: CI ? 2 : parseInt(VITEST_MAX_THREADS || '4', 10),
        maxThreads: CI ? 2 : parseInt(VITEST_MAX_THREADS || '4', 10),
      },
    },
  },
});

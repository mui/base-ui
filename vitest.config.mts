import path from 'path';
import { defineConfig } from 'vitest/config';

const MONOREPO_ROOT = path.resolve(__dirname, './');

export default defineConfig({
  resolve: {
    alias: [
      {
        find: `@base_ui/react`,
        replacement: new URL(`./packages/mui-base/src`, import.meta.url).pathname,
      },
    ],
  },
  test: {
    globals: true,
    setupFiles: ['test/setupVitest.ts'],
    // Required for some tests that contain early returns.
    // Should be removed once we migrate to vitest.
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: path.resolve(MONOREPO_ROOT, 'coverage'),
      include: ['packages/*/src/**/*.ts', 'packages/*/src/**/*.tsx'],
    },
    sequence: {
      hooks: 'list',
    },
    env: {
      MUI_VITEST: 'true',
    },
  },
});

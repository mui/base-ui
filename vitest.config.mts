import path from 'path';
import { defineConfig } from 'vitest/config';

const WORKSPACE_ROOT = path.resolve(__dirname, './');

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
  },
});

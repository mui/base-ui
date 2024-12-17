import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/*/vitest.config.mts',
  'docs/vitest.config.mts',
  'test/e2e/vitest.config.mts',
  'test/regressions/vitest.config.mts',
]);

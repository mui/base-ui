import { mergeConfig, defineProject } from 'vitest/config';
// eslint-disable-next-line import/no-relative-packages
import sharedConfig from '../vitest.shared.mts';

export default mergeConfig(
  sharedConfig,
  defineProject({
    // Next.js preserves JSX for its compiler; component tests need Vite to transform it.
    oxc: {
      jsx: { runtime: 'automatic' },
    },
    test: {
      environment: 'node',
      browser: {
        enabled: false,
        name: 'node',
      },
      env: {
        VITEST_ENV: 'node',
      },
    },
  }),
);

import { mergeConfig, defineProject } from 'vitest/config';
import sharedConfig from '../../vitest.shared.mts';

export default mergeConfig(
  sharedConfig,
  defineProject({
    test: {
      environment: 'node',
      testTimeout: (process.env.CIRCLECI === 'true' ? 4 : 2) * 1000, // Circle CI has low-performance CPUs.
      browser: {
        provider: 'playwright',
        enabled: false,
        name: 'node',
      },
      env: {
        VITEST_ENV: 'node',
      },
    },
  }),
);

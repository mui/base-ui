import { mergeConfig, defineProject } from 'vitest/config';
import sharedConfig from '../vitest.shared';

export default mergeConfig(
  sharedConfig,
  defineProject({
    test: {
      environment: 'node',
      browser: {
        enabled: false,
        name: 'node',
      },
    },
  }),
);

import { mergeConfig, defineProject } from 'vitest/config';
import react from '@vitejs/plugin-react';
// eslint-disable-next-line import/no-relative-packages
import sharedConfig from '../vitest.shared.mts';

export default mergeConfig(
  sharedConfig,
  defineProject({
    plugins: [react()],
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

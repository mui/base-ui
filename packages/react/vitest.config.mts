import * as path from 'path';
import { mergeConfig, defineProject } from 'vitest/config';
// eslint-disable-next-line import/no-relative-packages
import sharedConfig from '../../vitest.shared.mts';

export default mergeConfig(
  sharedConfig,
  defineProject({
    define: {
      'process.env.NODE_ENV': JSON.stringify('test'),
    },
    resolve: {
      alias: {
        '@base-ui-components/react': path.join(process.cwd(), 'packages/react/src'),
      },
    },
  }),
);

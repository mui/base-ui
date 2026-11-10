import { resolve } from 'node:path';
import { mergeConfig, defineProject } from 'vitest/config';
// eslint-disable-next-line import/no-relative-packages
import sharedConfig from '../vitest.shared.mts';

// Browser tests of the docs demos. The `docs` project runs in Node, so it excludes them.
export default mergeConfig(
  sharedConfig,
  defineProject({
    // Next.js preserves JSX for its compiler; component tests need Vite to transform it.
    oxc: { jsx: { runtime: 'automatic' } },
    optimizeDeps: {
      entries: [resolve(import.meta.dirname, 'src/**/*.browser.test.tsx')],
      holdUntilCrawlEnd: true,
    },
    test: {
      name: 'docs-browser',
      browser: { viewport: { width: 1000, height: 800 } },
      include: ['src/**/*.browser.test.tsx'],
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify('test'),
    },
  }),
);

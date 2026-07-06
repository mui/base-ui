import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
const dirname = path.dirname(fileURLToPath(import.meta.url));
const reactSrc = path.resolve(dirname, '../../packages/react/src');
const utilsSrc = path.resolve(dirname, '../../packages/utils/src');

export default defineConfig({
  // Mirror vite.config.ts: vitest does not merge the app's vite config when a
  // vitest config exists, and the workspace symlink for @base-ui/react points
  // at the (unbuilt) build directory. Stories must exercise the source.
  resolve: {
    alias: [
      { find: /^@base-ui\/react\/(.*)$/, replacement: `${reactSrc}/$1` },
      { find: /^@base-ui\/react$/, replacement: reactSrc },
      { find: /^@base-ui\/utils\/(.*)$/, replacement: `${utilsSrc}/$1` },
      { find: /^@base-ui\/utils$/, replacement: utilsSrc },
    ],
    dedupe: ['react', 'react-dom'],
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in the Storybook config
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});

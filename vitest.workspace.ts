import react from '@vitejs/plugin-react';
import { defineWorkspace } from 'vitest/config';

// Ideally we move the configuration to each package.
// Currently it doesn't work because vitest doesn't detect two different configurations in the same package.
// We could bypass this limitation by having a folder per configuration. Eg: `packages/x-charts/browser` & `packages/x-charts/jsdom`.

export default defineWorkspace([
  {
    extends: './vitest.config.mts',
    plugins: [react({ jsxRuntime: 'classic' })],
    test: {
      include: [`packages/mui-base/src/**/*.test.?(c|m)[jt]s?(x)`],
      exclude: [`packages/mui-base/src/**/*.browser.test.?(c|m)[jt]s?(x)`],
      name: `jsdom/mui-base`,
      environment: 'jsdom',
      env: {
        MUI_JSDOM: 'true',
      },
    },
  },
]);

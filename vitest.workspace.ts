import react from '@vitejs/plugin-react';
import { defineWorkspace, WorkspaceProjectConfiguration } from 'vitest/config';

// Ideally we move the configuration to each package.
// Currently it doesn't work because vitest doesn't detect two different configurations in the same package.
// We could bypass this limitation by having a folder per configuration. Eg: `packages/x-charts/browser` & `packages/x-charts/jsdom`.

const commonSettings: WorkspaceProjectConfiguration = {
  extends: './vitest.config.mts',
  plugins: [react()],
  test: {
    include: [`packages/mui-base/src/**/*.test.?(c|m)[jt]s?(x)`],
    exclude: [`packages/mui-base/src/**/*.jsdom.test.?(c|m)[jt]s?(x)`],
  },
};

const runJSDOMTests = process.env.VITE_TESTS === 'all' || process.env.VITE_TESTS === 'jsdom';
const runChromiumTests =
  process.env.VITE_TESTS === 'all' ||
  process.env.VITE_TESTS === 'browsers' ||
  process.env.VITE_TESTS === 'chromium';
const runFirefoxTests =
  process.env.VITE_TESTS === 'all' ||
  process.env.VITE_TESTS === 'browsers' ||
  process.env.VITE_TESTS === 'firefox';

const workspace: WorkspaceProjectConfiguration[] = [];

if (runJSDOMTests) {
  workspace.push({
    ...commonSettings,
    test: {
      ...commonSettings.test,
      name: `jsdom/base-ui`,
      environment: 'jsdom',
      env: {
        MUI_JSDOM: 'true',
      },
    },
  });
}

if (runChromiumTests) {
  workspace.push({
    ...commonSettings,
    test: {
      ...commonSettings.test,
      name: `browser.chromium/base-ui`,
      env: {
        MUI_BROWSER: 'true',
      },
      browser: {
        enabled: true,
        name: 'chromium',
        provider: 'playwright',
        headless: false,
        screenshotFailures: false,
      },
    },
  });
}

if (runFirefoxTests) {
  workspace.push({
    ...commonSettings,
    test: {
      ...commonSettings.test,
      name: `browser.firefox/base-ui`,
      env: {
        MUI_BROWSER: 'true',
      },
      browser: {
        enabled: true,
        name: 'firefox',
        provider: 'playwright',
        headless: false,
        screenshotFailures: false,
      },
    },
  });
}

export default defineWorkspace(workspace);

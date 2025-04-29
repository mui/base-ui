import { expect } from 'chai';
import { chromium, ElementHandle, Page, Browser } from '@playwright/test';
import { describe, it, beforeAll } from 'vitest';
import type {
  ByRoleMatcher,
  ByRoleOptions,
  Matcher,
  MatcherOptions,
  SelectorMatcherOptions,
} from '@testing-library/dom';
import '@mui/internal-test-utils/initMatchers';
import '@mui/internal-test-utils/initPlaywrightMatchers';

const BASE_URL = 'http://localhost:5173';

function sleep(duration: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, duration);
  });
}

interface PlaywrightScreen {
  getByLabelText: (
    labelText: Matcher,
    options?: SelectorMatcherOptions,
  ) => Promise<ElementHandle<HTMLElement>>;
  getByRole: (role: ByRoleMatcher, options?: ByRoleOptions) => Promise<ElementHandle<HTMLElement>>;
  getByTestId: (testId: string, options?: MatcherOptions) => Promise<ElementHandle<HTMLElement>>;
  getByText: (
    text: Matcher,
    options?: SelectorMatcherOptions,
  ) => Promise<ElementHandle<HTMLElement>>;
}

/**
 * Attempts page.goto with retries
 *
 * @remarks The server and runner can be started up simultaneously
 * @param page
 * @param url
 */
async function attemptGoto(page: Page, url: string): Promise<boolean> {
  const maxAttempts = 10;
  const retryTimeoutMS = 250;

  let didNavigate = false;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await page.goto(url);
      didNavigate = true;
    } catch (error) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(retryTimeoutMS);
    }
  }

  return didNavigate;
}

describe('e2e', () => {
  let browser: Browser;
  let page: Page;
  const screen: PlaywrightScreen = {
    getByLabelText: (...inputArgs) => {
      return page.evaluateHandle(
        (args) => window.DomTestingLibrary.getByLabelText(document.body, ...args),
        inputArgs,
      );
    },
    getByRole: (...inputArgs) => {
      return page.evaluateHandle(
        (args) => window.DomTestingLibrary.getByRole(document.body, ...args),
        inputArgs,
      );
    },
    getByText: (...inputArgs) => {
      return page.evaluateHandle(
        (args) => window.DomTestingLibrary.getByText(document.body, ...args),
        inputArgs,
      );
    },
    getByTestId: (...inputArgs) => {
      return page.evaluateHandle(
        (args) => window.DomTestingLibrary.getByTestId(document.body, ...args),
        inputArgs,
      );
    },
  };

  async function renderFixture(fixturePath: string) {
    await page.goto(`${BASE_URL}/e2e-fixtures/${fixturePath}#no-dev`);
    await page.waitForSelector('[data-testid="testcase"]:not([aria-busy="true"])');
  }

  beforeAll(async function beforeHook() {
    browser = await chromium.launch({
      headless: true,
    });
    page = await browser.newPage();
    const isServerRunning = await attemptGoto(page, `${BASE_URL}#no-dev`);
    if (!isServerRunning) {
      throw new Error(
        `Unable to navigate to ${BASE_URL} after multiple attempts. Did you forget to run \`pnpm test:e2e:server\` and \`pnpm test:e2e:build\`?`,
      );
    }
  }, 20000);

  after(async () => {
    await browser.close();
  });

  describe('<Radio />', () => {
    it('loops focus by default', async () => {
      await renderFixture('Radio');

      await page.keyboard.press('Tab');
      await expect(screen.getByTestId('one')).toHaveFocus();

      await page.keyboard.press('ArrowRight');
      await expect(screen.getByTestId('two')).toHaveFocus();

      await page.keyboard.press('ArrowLeft');
      await expect(screen.getByTestId('one')).toHaveFocus();

      await page.keyboard.press('ArrowLeft');
      await expect(screen.getByTestId('three')).toHaveFocus();
    });
  });
});

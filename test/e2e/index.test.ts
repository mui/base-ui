import { chromium, expect, Page, Browser } from '@playwright/test';
import { describe, it, beforeAll } from 'vitest';
import '@mui/internal-test-utils/initPlaywrightMatchers';

const BASE_URL = 'http://localhost:5173';

function delay(duration: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, duration);
  });
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
      await delay(retryTimeoutMS);
    }
  }

  return didNavigate;
}

describe('e2e', () => {
  let browser: Browser;
  let page: Page;

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

  describe('<Field />', () => {
    describe('validationMode=onChange', () => {
      it('<Field.Control />', async () => {
        await renderFixture('field/validate-on-change/Input');

        const error = await page.getByTestId('error');
        await expect(error).toBeHidden();

        const input = page.getByRole('textbox');

        await input.press('a');
        await expect(page.getByText('tooShort error')).toBeVisible();
        expect(error).toHaveCount(1);

        // clear the input
        await input.press('Backspace');
        await expect(page.getByText('valueMissing error')).toBeVisible();
        expect(error).toHaveCount(1);

        await input.pressSequentially('abc');
        await expect(input).toHaveValue('abc');
        await expect(error).toBeHidden();

        await input.press('d');
        await expect(input).toHaveValue('abcd');
        await expect(page.getByText('custom error')).toBeVisible();
        expect(error).toHaveCount(1);

        await input.press('Backspace');
        await expect(input).toHaveValue('abc');
        await expect(error).toBeHidden();

        await input.press('Backspace');
        await expect(input).toHaveValue('ab');
        expect(error).toHaveCount(1);
        await expect(page.getByText('tooShort error')).toBeVisible();

        await input.press('Backspace');
        await input.press('Backspace');
        await expect(input).toHaveValue('');
        expect(error).toHaveCount(1);
        await expect(page.getByText('valueMissing error')).toBeVisible();
      });

      it('<Select />', async () => {
        // options one & three returns errors
        // options two and four are valid
        // the field is required
        await renderFixture('field/validate-on-change/Select');

        const error = await page.getByTestId('error');
        await expect(error).toBeHidden();

        const trigger = await page.getByRole('combobox');
        await expect(trigger).toHaveText('select');

        const options = page.getByRole('option');

        await trigger.click();
        await options.filter({ hasText: 'one' }).click();
        await expect(trigger).toHaveText('one');
        await expect(error).toHaveText('error one');

        await trigger.click();
        await options.filter({ hasText: 'two' }).click();
        await expect(trigger).toHaveText('two');
        await expect(error).toBeHidden();

        await trigger.click();
        // clear the value
        await options.filter({ hasText: 'select' }).click();
        await expect(trigger).toHaveText('select');
        await expect(error).toHaveText('valueMissing error');

        await trigger.click();
        await options.filter({ hasText: 'three' }).click();
        await expect(trigger).toHaveText('three');
        await expect(error).toHaveText('error three');

        await trigger.click();
        await options.filter({ hasText: 'four' }).click();
        await expect(trigger).toHaveText('four');
        await expect(error).toBeHidden();
      });
    });
  });

  describe('<Radio />', () => {
    it('loops focus by default', async () => {
      await renderFixture('Radio');

      await page.keyboard.press('Tab');
      await expect(page.getByTestId('one')).toBeFocused();

      await page.keyboard.press('ArrowRight');
      await expect(page.getByTestId('two')).toBeFocused();

      await page.keyboard.press('ArrowLeft');
      await expect(page.getByTestId('one')).toBeFocused();

      await page.keyboard.press('ArrowLeft');
      await expect(page.getByTestId('three')).toBeFocused();
    });
  });

  describe('<Slider />', () => {
    it('overlapping thumbs', async () => {
      await renderFixture('slider/Range');

      // mouse down at the center of the lower thumb but the upper thumb
      // is moved due to overlap
      await page.mouse.move(25, 10);
      await page.mouse.down();
      await page.mouse.move(100, 10);
      await page.mouse.up();

      await expect(page.getByRole('status')).toHaveText('25 – 100');
    });

    it('overlapping thumbs at max', async () => {
      await renderFixture('slider/RangeSliderMax');

      // both thumbs are at max with the upper thumb completely covering the
      // lower one; the lower one will be moved by the pointer instead so the
      // slider doesn't get stuck
      await page.mouse.move(100, 10);
      await page.mouse.down();
      await page.mouse.move(50, 10);
      await page.mouse.up();

      await expect(page.getByRole('status')).toHaveText('50 – 100');
    });

    it('inset thumbs', async () => {
      await renderFixture('slider/Inset');
      await expect(page.getByRole('status')).toHaveText('30');

      // click the left inset offset region
      await page.mouse.click(10, 10);
      await expect(page.getByRole('status')).toHaveText('0');
      // click the right inset offset region
      await page.mouse.click(110, 10);
      await expect(page.getByRole('status')).toHaveText('100');
      // drag from the center of the thumb
      await page.mouse.move(110, 10);
      await page.mouse.down();
      await page.mouse.move(90, 10);
      await page.mouse.up();
      await expect(page.getByRole('status')).toHaveText('80');
    });
  });
});

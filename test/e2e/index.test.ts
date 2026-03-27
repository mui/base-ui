import { describe, it, beforeAll, afterAll } from 'vitest';
import { chromium, expect, Page, Browser } from '@playwright/test';
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

  afterAll(async () => {
    await browser.close();
  });

  describe('<Field />', () => {
    describe('validationMode=onChange', () => {
      it('<Field.Control />', async () => {
        await renderFixture('field/validate-on-change/Input');

        const valueMissingError = page.getByText('valueMissing error');
        const tooShortError = page.getByText('tooShort error');
        const customError = page.getByText('custom error');

        await expect(valueMissingError).toBeHidden();
        await expect(tooShortError).toBeHidden();
        await expect(customError).toBeHidden();

        const input = page.getByRole('textbox');

        await input.press('a');
        await expect(tooShortError).toBeVisible();

        // clear the input
        await input.press('Backspace');
        await expect(valueMissingError).toBeVisible();

        await input.pressSequentially('abc');
        await expect(input).toHaveValue('abc');
        await expect(valueMissingError).toBeHidden();
        await expect(tooShortError).toBeHidden();
        await expect(customError).toBeHidden();

        await input.press('d');
        await expect(input).toHaveValue('abcd');
        await expect(customError).toBeVisible();

        await input.press('Backspace');
        await expect(input).toHaveValue('abc');
        await expect(valueMissingError).toBeHidden();
        await expect(tooShortError).toBeHidden();
        await expect(customError).toBeHidden();

        await input.press('Backspace');
        await expect(input).toHaveValue('ab');
        await expect(tooShortError).toBeVisible();

        await input.press('Backspace');
        await input.press('Backspace');
        await expect(input).toHaveValue('');
        await expect(valueMissingError).toBeVisible();
      });

      it('<Select />', async () => {
        // options one & three returns errors
        // options two and four are valid
        // the field is required
        await renderFixture('field/validate-on-change/Select');

        const valueMissingError = page.getByText('valueMissing error');
        const errorOne = page.getByText('error one');
        const errorThree = page.getByText('error three');

        await expect(valueMissingError).toBeHidden();
        await expect(errorOne).toBeHidden();
        await expect(errorThree).toBeHidden();

        const trigger = await page.getByRole('combobox');
        await expect(trigger).toHaveText('select');

        const options = page.getByRole('option');

        await trigger.click();
        await options.filter({ hasText: 'one' }).click();
        await expect(trigger).toHaveText('one');
        await expect(errorOne).toBeVisible();

        await trigger.click();
        await options.filter({ hasText: 'two' }).click();
        await expect(trigger).toHaveText('two');
        await expect(valueMissingError).toBeHidden();
        await expect(errorOne).toBeHidden();
        await expect(errorThree).toBeHidden();

        await trigger.click();
        // clear the value
        await options.filter({ hasText: 'select' }).click();
        await expect(trigger).toHaveText('select');
        await expect(valueMissingError).toBeVisible();

        await trigger.click();
        await options.filter({ hasText: 'three' }).click();
        await expect(trigger).toHaveText('three');
        await expect(errorThree).toBeVisible();

        await trigger.click();
        await options.filter({ hasText: 'four' }).click();
        await expect(trigger).toHaveText('four');
        await expect(valueMissingError).toBeHidden();
        await expect(errorOne).toBeHidden();
        await expect(errorThree).toBeHidden();
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

  describe('<Calendar />', () => {
    it('preserves focus after an animated viewport transition settles', async () => {
      await renderFixture('calendar/AnimatedViewport');

      await page.getByTestId('next-month').click();

      const aprilSeventh = page.getByRole('button', { name: 'Tuesday, April 7th, 2026' });
      await aprilSeventh.focus();
      await expect(aprilSeventh).toBeFocused();

      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(300);

      const activeElementLabel = await page.evaluate(() => {
        return (
          document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName
        );
      });

      expect(activeElementLabel).toBe('Tuesday, March 31st, 2026');
    }, 5000);

    it('preserves focus after the Motion demo wraps left into the previous month', async () => {
      await renderFixture('calendar/AnimatedMotionViewport');

      await page.getByRole('button', { name: 'Next month' }).click();
      await expect
        .poll(async () => {
          return page.getByRole('button', { name: 'Wednesday, April 1st, 2026' }).count();
        })
        .toBe(1);

      const aprilFirst = page.getByRole('button', { name: 'Wednesday, April 1st, 2026' });
      await aprilFirst.focus();
      await expect(aprilFirst).toBeFocused();

      await page.keyboard.press('ArrowLeft');

      await expect
        .poll(async () => {
          return page.evaluate(() => {
            return (
              document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName
            );
          });
        })
        .toBe('Tuesday, March 31st, 2026');

      await page.waitForTimeout(500);

      expect(
        await page.evaluate(() => {
          return (
            document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName
          );
        }),
      ).toBe('Tuesday, March 31st, 2026');
    }, 5000);

    it('preserves focus after the Motion demo pages into the next month', async () => {
      await renderFixture('calendar/AnimatedMotionViewport');

      await page.getByRole('button', { name: 'Next month' }).click();

      const aprilFifteenth = page.getByRole('button', { name: 'Wednesday, April 15th, 2026' });
      await aprilFifteenth.focus();
      await expect(aprilFifteenth).toBeFocused();

      await page.keyboard.press('PageDown');

      await expect
        .poll(async () => {
          return page.evaluate(() => {
            return (
              document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName
            );
          });
        })
        .toBe('Friday, May 15th, 2026');

      await page.waitForTimeout(500);

      expect(
        await page.evaluate(() => {
          return (
            document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName
          );
        }),
      ).toBe('Friday, May 15th, 2026');
    }, 5000);

    it('preserves focus after the Motion demo wraps right into the next month', async () => {
      await renderFixture('calendar/AnimatedMotionViewport');

      await page.getByRole('button', { name: 'Next month' }).click();

      const aprilThirtieth = page
        .getByRole('button', { name: 'Thursday, April 30th, 2026' })
        .first();
      await aprilThirtieth.focus();
      await expect
        .poll(async () => {
          return page.evaluate(() => {
            return (
              document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName
            );
          });
        })
        .toBe('Thursday, April 30th, 2026');

      await page.keyboard.press('ArrowRight');

      await expect
        .poll(async () => {
          return page.evaluate(() => {
            return (
              document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName
            );
          });
        })
        .toBe('Friday, May 1st, 2026');

      await page.waitForTimeout(500);

      expect(
        await page.evaluate(() => {
          return (
            document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName
          );
        }),
      ).toBe('Friday, May 1st, 2026');
    }, 7000);

    it('allows interrupted Motion demo navigation while the month animation is still running', async () => {
      await renderFixture('calendar/AnimatedMotionViewport');

      await page.getByRole('button', { name: 'Next month' }).click();

      const aprilThirtieth = page
        .getByRole('button', { name: 'Thursday, April 30th, 2026' })
        .first();
      await aprilThirtieth.focus();
      await expect
        .poll(async () => {
          return page.evaluate(() => {
            return (
              document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName
            );
          });
        })
        .toBe('Thursday, April 30th, 2026');

      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(20);
      await page.keyboard.press('ArrowRight');

      await expect
        .poll(async () => {
          return page.evaluate(() => {
            return (
              document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName
            );
          });
        })
        .toBe('Saturday, May 2nd, 2026');

      await page.waitForTimeout(500);

      expect(
        await page.evaluate(() => {
          return (
            document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName
          );
        }),
      ).toBe('Saturday, May 2nd, 2026');
    }, 7000);
  });

  describe('<Menu />', () => {
    describe('<Menu.LinkItem />', () => {
      it('navigates on click', async () => {
        await renderFixture('menu/LinkItemNavigation');

        const trigger = page.getByTestId('menu-trigger');
        await trigger.click();

        const linkOne = page.getByTestId('link-one');
        await linkOne.click();

        await expect(page).toHaveURL(/\/e2e-fixtures\/menu\/PageOne/);
        await expect(page.getByTestId('test-page')).toHaveText('Page one');

        await page.goBack();
        await expect(page.getByTestId('page-heading')).toHaveText('Menu with Link Items');

        await trigger.click();
        const linkTwo = page.getByTestId('link-two');
        await linkTwo.click();

        await expect(page).toHaveURL(/\/e2e-fixtures\/menu\/PageTwo/);
        await expect(page.getByTestId('test-page')).toHaveText('Page two');
      });

      it('navigates on Enter key press', async () => {
        await renderFixture('menu/LinkItemNavigation');

        await page.keyboard.press('Tab');
        await page.keyboard.press('Enter');
        // first item (page one) is initially highlighted
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');

        await expect(page).toHaveURL(/\/e2e-fixtures\/menu\/PageTwo/);
        await expect(page.getByTestId('test-page')).toHaveText('Page two');
      });

      it('navigates when rendering React Router Link component', async () => {
        await renderFixture('menu/ReactRouterLinkItemNavigation');

        const trigger = page.getByTestId('menu-trigger');
        await trigger.click();

        const linkOne = page.getByTestId('link-one');
        await linkOne.click();

        await expect(page).toHaveURL(/\/e2e-fixtures\/menu\/PageOne/);
        await expect(page.getByTestId('test-page')).toHaveText('Page one');

        await page.goBack();
        await expect(page.getByTestId('page-heading')).toHaveText(
          'Menu with React Router Link Items',
        );

        await trigger.click();
        const linkTwo = page.getByTestId('link-two');
        await linkTwo.click();

        await expect(page).toHaveURL(/\/e2e-fixtures\/menu\/PageTwo/);
        await expect(page.getByTestId('test-page')).toHaveText('Page two');
      });
    });
  });
});

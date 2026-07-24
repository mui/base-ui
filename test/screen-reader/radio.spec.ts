import { expect } from '@playwright/test';
import { screenReaderTest as test, type ScreenReaderPlaywright } from '@guidepup/playwright';

const MAX_NAVIGATION_STEPS = 10;

async function navigateToItem(
  screenReader: ScreenReaderPlaywright,
  name: RegExp,
  step = 0,
): Promise<string> {
  const itemText = await screenReader.itemText();

  if (name.test(itemText)) {
    return itemText;
  }

  if (step === MAX_NAVIGATION_STEPS) {
    throw new Error(`Guidepup did not navigate to an item matching ${name}.`);
  }

  await screenReader.next();
  return navigateToItem(screenReader, name, step + 1);
}

test.use({ screenReaderStartOptions: { capture: true } });

test("announces a radio option's accessible name", async ({ page, screenReader }) => {
  await page.goto('/e2e-fixtures/Radio#no-dev');
  await page.locator('[data-testid="testcase"]:not([aria-busy="true"])').waitFor();
  await screenReader.navigateToWebContent();

  const itemText = await navigateToItem(screenReader, /fuji/i);
  const spokenPhrase = await screenReader.lastSpokenPhrase();

  expect(itemText).toMatch(/fuji/i);
  expect(spokenPhrase).toMatch(/fuji/i);
  expect(spokenPhrase).toMatch(/radio/i);
});

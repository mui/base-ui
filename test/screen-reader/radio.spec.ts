import { expect } from '@playwright/test';
import { screenReaderTest as test } from '@guidepup/playwright';
import { navigateToItem } from './utils';

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

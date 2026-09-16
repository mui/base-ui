import { expect, type Page } from '@playwright/test';
import { screenReaderTest as test, type ScreenReaderPlaywright } from '@guidepup/playwright';

const MAX_NAVIGATION_STEPS = 20;

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

// Recursive rather than a loop, as the rule against awaiting in one asks, and as the other spec
// in this directory walks the reader.
async function pressArrowDown(page: Page, times: number): Promise<void> {
  if (times === 0) {
    return;
  }

  await page.keyboard.press('ArrowDown');
  await pressArrowDown(page, times - 1);
}

test.use({ screenReaderStartOptions: { capture: true } });

/**
 * A grid-shaped role owns its rows through the virtualizer's scrollport and `role="presentation"`
 * wrappers, and only part of the collection is mounted. This checks that what the rows state for
 * themselves — their level, their position among their siblings, and their row number within the
 * whole collection — survives both.
 */
test('announces a virtualized treegrid row by its place in the tree', async ({
  page,
  screenReader,
}) => {
  await page.goto('/e2e-fixtures/VirtualizedTreegrid#no-dev');
  await page.locator('[data-testid="testcase"]:not([aria-busy="true"])').waitFor();
  await screenReader.navigateToWebContent();

  const itemText = await navigateToItem(screenReader, /folder 1/i);
  const folderPhrase = await screenReader.lastSpokenPhrase();

  expect(itemText).toMatch(/folder 1/i);
  // The grid, its size, and the row's own place in it rather than its index in the flat window.
  expect(folderPhrase).toMatch(/files/i);
  expect(folderPhrase).toMatch(/1 of 20/i);

  // A row deeper in the collection: mounted only because the window moved to it, and still
  // announced against its own siblings rather than against the 1,000 rows of the collection.
  await page.keyboard.press('Tab');
  // Sixty rows down: past the first folder's fifty files and into the second folder's.
  await pressArrowDown(page, 60);
  const rowPhrase = await screenReader.lastSpokenPhrase();

  expect(rowPhrase).toMatch(/file 2\.9/i);
  expect(rowPhrase).toMatch(/9 of 50/i);
  expect(rowPhrase).not.toMatch(/of 1000/i);
});

import { expect } from '@playwright/test';
import { screenReaderTest as test } from '@guidepup/playwright';

test.use({ screenReaderStartOptions: { capture: true } });

/**
 * A grid-shaped role owns its rows through the virtualizer's scrollport and `role="presentation"`
 * wrappers, and only part of the collection is mounted. This checks that what the rows state for
 * themselves — their level and their position among their siblings — survives both.
 *
 * Rows are reached by focus, as a treegrid is used: a row's place among its siblings is what a
 * reader announces when the row takes focus, whichever mode it reads the page in. Reading the
 * page line by line never reached the first row under NVDA, which shows a treegrid's rows as tree
 * items and takes focus mode for them.
 *
 * Guidepup records speech only while one of its own commands runs, so what the page does through
 * Playwright is wrapped in `screenReader.capture()`: speech it causes outside one is never logged.
 *
 * The deep row is reached in one jump rather than by arrowing to it: every key press is announced,
 * and sixty announcements take longer than the whole rest of the run.
 */
test('announces a virtualized treegrid row by its place in the tree', async ({
  page,
  screenReader,
}) => {
  await page.goto('/e2e-fixtures/VirtualizedTreegrid#no-dev');
  await page.locator('[data-testid="testcase"]:not([aria-busy="true"])').waitFor();
  await screenReader.navigateToWebContent();

  // Settling into the page clicks the middle of the body and Tabs once, so where it leaves focus
  // depends on the layout: here the click lands on the treegrid and the Tab takes the first row
  // already. Tabbing from the control before the grid makes the first row the next stop whatever
  // that settling did.
  await screenReader.capture(() => page.getByTestId('reveal').focus());
  await screenReader.press('Tab');
  const folderPhrase = await screenReader.lastSpokenPhrase();
  console.log('Screen reader, first row:', folderPhrase);

  expect(folderPhrase).toMatch(/folder 1/i);
  // The first folder is the first of twenty folders, not the first of 1,020 rows.
  expect(folderPhrase).toMatch(/1 of 20/i);

  // A row the first window never held: revealed rather than arrowed to, and still announced
  // against its own siblings.
  const { spokenPhrase: revealedPhrase } = await screenReader.capture(async () => {
    await page.getByTestId('reveal').click();
    await expect(page.locator('[data-index="721"]')).toBeFocused();
  });
  console.log('Screen reader, revealed row:', revealedPhrase);

  expect(revealedPhrase).toMatch(/file 15\.7/i);
  expect(revealedPhrase).toMatch(/7 of 50/i);
});

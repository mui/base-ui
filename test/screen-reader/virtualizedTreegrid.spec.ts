import { expect } from '@playwright/test';
import { screenReaderTest as test, type ScreenReaderPlaywright } from '@guidepup/playwright';

const MAX_NAVIGATION_STEPS = 20;
/** Every step is spoken, so waiting for a phrase is waiting for speech. */
const PHRASE_TIMEOUT = 30_000;

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

/**
 * A grid-shaped role owns its rows through the virtualizer's scrollport and `role="presentation"`
 * wrappers, and only part of the collection is mounted. This checks that what the rows state for
 * themselves — their level and their position among their siblings — survives both.
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

  const itemText = await navigateToItem(screenReader, /folder 1/i);
  const folderPhrase = await screenReader.lastSpokenPhrase();
  console.log('VoiceOver, first row:', folderPhrase);

  expect(itemText).toMatch(/folder 1/i);
  // The first folder is the first of twenty folders, not the first of 1,020 rows.
  expect(folderPhrase).toMatch(/1 of 20/i);

  // A row the first window never held: revealed rather than arrowed to, and still announced
  // against its own siblings.
  await page.getByTestId('reveal').click();
  await page.locator('[data-index="721"]').waitFor();
  await expect
    .poll(() => screenReader.lastSpokenPhrase(), { timeout: PHRASE_TIMEOUT })
    .toMatch(/file 15\.7/i);

  const revealedPhrase = await screenReader.lastSpokenPhrase();
  console.log('VoiceOver, revealed row:', revealedPhrase);

  expect(revealedPhrase).toMatch(/7 of 50/i);
});

import { expect } from '@playwright/test';
import { screenReaderTest as test, type ScreenReaderPlaywright } from '@guidepup/playwright';

/** Every step is spoken, so waiting for a phrase is waiting for speech. */
const PHRASE_TIMEOUT = 30_000;
const PHRASE_POLL_INTERVAL = 250;
/**
 * The page's tab stops before the first row: the reveal control, and whatever the reader itself
 * left focus on while settling into the page.
 */
const MAX_TAB_STOPS = 4;

/** What the reader has said, for a failure to show instead of only what it did not say. */
async function describeSpeech(screenReader: ScreenReaderPlaywright): Promise<string> {
  const log = await screenReader.spokenPhraseLog();

  if (log.length === 0) {
    return '(nothing)';
  }

  return log.map((phrase, index) => `${index + 1}. ${phrase}`).join('\n');
}

async function findPhrase(
  screenReader: ScreenReaderPlaywright,
  pattern: RegExp,
): Promise<string | undefined> {
  const log = await screenReader.spokenPhraseLog();
  return log.find((phrase) => pattern.test(phrase));
}

/**
 * The first phrase matching the pattern once the reader has spoken it. Readers speak a focus
 * change as several phrases at times, and may follow it with a mode change, so the log is
 * searched rather than its last entry sampled.
 */
async function waitForPhrase(
  screenReader: ScreenReaderPlaywright,
  pattern: RegExp,
  deadline = Date.now() + PHRASE_TIMEOUT,
): Promise<string> {
  const phrase = await findPhrase(screenReader, pattern);

  if (phrase !== undefined) {
    return phrase;
  }

  if (Date.now() >= deadline) {
    throw new Error(
      `The screen reader said nothing matching ${pattern}. It said:\n${await describeSpeech(screenReader)}`,
    );
  }

  await new Promise((resolve) => {
    setTimeout(resolve, PHRASE_POLL_INTERVAL);
  });
  return waitForPhrase(screenReader, pattern, deadline);
}

/**
 * Tabs until the reader announces the item, the way a user reaches a row: the grid's roving
 * tabindex makes its active row a tab stop. Recursive rather than a loop, as the rule against
 * awaiting in one asks.
 */
async function tabToItem(
  screenReader: ScreenReaderPlaywright,
  name: RegExp,
  stop = 0,
): Promise<string> {
  const phrase = await findPhrase(screenReader, name);

  if (phrase !== undefined) {
    return phrase;
  }

  if (stop === MAX_TAB_STOPS) {
    throw new Error(
      `Tab did not reach an item matching ${name} in ${MAX_TAB_STOPS} stops. The screen reader said:\n${await describeSpeech(screenReader)}`,
    );
  }

  await screenReader.press('Tab');
  return tabToItem(screenReader, name, stop + 1);
}

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

  // Only what the Tabs cause is of interest, not what settling into the page had the reader say.
  await screenReader.clearSpokenPhraseLog();
  const folderPhrase = await tabToItem(screenReader, /folder 1/i);
  console.log('Screen reader, first row:', folderPhrase);

  // The first folder is the first of twenty folders, not the first of 1,020 rows.
  expect(folderPhrase).toMatch(/1 of 20/i);

  // A row the first window never held: revealed rather than arrowed to, and still announced
  // against its own siblings.
  await screenReader.clearSpokenPhraseLog();
  await page.getByTestId('reveal').click();
  await page.locator('[data-index="721"]').waitFor();
  const revealedPhrase = await waitForPhrase(screenReader, /file 15\.7/i);
  console.log('Screen reader, revealed row:', revealedPhrase);

  expect(revealedPhrase).toMatch(/7 of 50/i);
});

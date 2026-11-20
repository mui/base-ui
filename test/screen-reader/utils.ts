import type { Page } from '@playwright/test';
import type { ScreenReaderPlaywright } from '@guidepup/playwright';

const MAX_NAVIGATION_STEPS = 10;
/** Every step is spoken, so waiting for a phrase is waiting for speech. */
const PHRASE_TIMEOUT = 30_000;
const PHRASE_POLL_INTERVAL = 250;
/** The tab stops before a fixture's first row, such as a control rendered before the tree. */
const MAX_TAB_STOPS = 4;

export async function navigateToItem(
  screenReader: ScreenReaderPlaywright,
  name: RegExp,
  step = 0,
): Promise<string> {
  const itemText = await screenReader.itemText();

  if (name.test(itemText)) {
    return itemText;
  }

  if (step === MAX_NAVIGATION_STEPS) {
    throw new Error(
      `Guidepup did not navigate to an item matching ${name}. Speech: ${JSON.stringify(await screenReader.spokenPhraseLog())}`,
    );
  }

  await screenReader.next();
  return navigateToItem(screenReader, name, step + 1);
}

/**
 * Opens an e2e fixture and moves the reader into it. The speech log starts empty, so only what
 * the test causes is in it, not what settling into the page had the reader say.
 */
export async function openFixture(
  page: Page,
  screenReader: ScreenReaderPlaywright,
  fixture: string,
): Promise<void> {
  await page.goto(`/e2e-fixtures/${fixture}#no-dev`);
  await page.locator('[data-testid="testcase"]:not([aria-busy="true"])').waitFor();
  // Tab starts from a button before the fixture, as from the previous control of a real page.
  // Guidepup moves NVDA to the top of the page, which can also move focus there: the button
  // takes it rather than the fixture's first control, which a roving tab stop would remember.
  await page.evaluate(() => {
    const start = document.createElement('button');
    start.id = 'screen-reader-start';
    start.textContent = 'Start';
    document.body.prepend(start);
  });
  // Guidepup clicks the middle of the body to focus the page. A body that fills the viewport
  // keeps that click below the fixture, which would otherwise focus and select a row.
  await page.addStyleTag({ content: 'body { min-height: 100vh; }' });
  await screenReader.navigateToWebContent();
  // Guidepup's setup moves NVDA to the next focusable element, which can be the fixture's first
  // row: focusing it makes it the roving tab stop. Mounting the fixture again through the client
  // router gives Tab a fresh tree.
  const navigate = (url: string) =>
    page.evaluate((path) => {
      window.history.pushState(null, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, url);
  await navigate('/e2e-fixtures/Radio#no-dev');
  await page.getByTestId('one').waitFor();
  await navigate(`/e2e-fixtures/${fixture}#no-dev`);
  await page.locator('[data-testid="testcase"]:not([aria-busy="true"])').waitFor();
  // Guidepup also leaves focus in the browser toolbar.
  await page.locator('#screen-reader-start').focus();
  await screenReader.clearSpokenPhraseLog();
}

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
export async function waitForPhrase(
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
 * Tabs until the reader announces the item, the way a user reaches a row: the tree's roving
 * tabindex makes one row a tab stop.
 */
export async function tabToItem(
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

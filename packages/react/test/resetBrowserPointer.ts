import { isJSDOM } from '@base-ui/utils/testUtils';

/**
 * Resets the Playwright/WebDriver pointer state that persists between browser tests by parking
 * the pointer at the center of the viewport.
 *
 * Call it before each test in files that open popups on hover. The pointer otherwise rests over
 * the top-left corner, where the first fixture element renders: headless Chromium on Linux (CI)
 * starts every page with the pointer at (0, 0), and the test iframe's body has no margin.
 * Chromium hovers whatever renders under the pointer on the next frame, with trusted events.
 */
export async function resetBrowserPointer() {
  if (!isJSDOM) {
    const { userEvent } = await import('vitest/browser');
    await userEvent.unhover(document.body);
  }
}

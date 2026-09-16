import { expect } from '@playwright/test';
import { screenReaderTest as test } from '@guidepup/playwright';
import { navigateToItem } from './utils';

test.skip(process.platform !== 'win32', 'This regression covers NVDA on Windows.');
test.use({ screenReaderStartOptions: { capture: true } });

for (const activation of ['Enter', 'screen reader activation'] as const) {
  test(`announces the filter input when opening a menu with ${activation}`, async ({
    page,
    screenReader,
  }) => {
    await page.goto('/e2e-fixtures/menu/Filter#no-dev');
    await page.locator('[data-testid="testcase"]:not([aria-busy="true"])').waitFor();
    await screenReader.navigateToWebContent();
    await navigateToItem(screenReader, /actions.*button/i);
    await screenReader.clearSpokenPhraseLog();

    if (activation === 'Enter') {
      await screenReader.press('Enter');
    } else {
      await screenReader.act();
    }

    const input = page.getByRole('searchbox', { name: 'Filter actions' });
    await expect(input).toBeFocused();

    // capture:true waits for a quiet speech interval and includes every announcement from the
    // action. Seeing the input anywhere in that log is insufficient: a later menu announcement
    // can cancel its speech even while DOM focus remains on the input.
    const openingSpeech = await screenReader.lastSpokenPhrase();
    expect(openingSpeech).toMatch(/filter actions.*(?:edit|search)/i);
    expect(openingSpeech).not.toMatch(/filter actions[\s\S]*actions menu/i);

    await screenReader.type('Save');
    await expect(input).toHaveValue('Save');
    await expect(page.getByRole('menuitem', { name: 'New file', exact: true })).toBeHidden();

    await screenReader.press('ArrowDown');
    expect(await screenReader.lastSpokenPhrase()).toMatch(/save.*menu item/i);

    await screenReader.press('Escape');
    await expect(page.getByRole('button', { name: 'Actions' })).toBeFocused();
  });
}

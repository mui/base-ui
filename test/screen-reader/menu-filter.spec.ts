import { expect } from '@playwright/test';
import { screenReaderTest as test } from '@guidepup/playwright';
import { navigateToItem } from './utils';

test.skip(process.platform !== 'win32', 'This regression covers NVDA on Windows.');
test.use({ screenReaderStartOptions: { capture: true } });
// A successful retry must not hide an intermittent opening-announcement regression.
test.describe.configure({ retries: 0 });

for (const activation of ['Enter', 'screen reader activation'] as const) {
  for (const attempt of [1, 2, 3]) {
    test(`announces the first action and exposes the filter input with ${activation} (${attempt})`, async ({
      page,
      screenReader,
    }) => {
      await page.goto('/e2e-fixtures/menu/Filter#no-dev');
      await page.locator('[data-testid="testcase"]:not([aria-busy="true"])').waitFor();
      await screenReader.navigateToWebContent();
      await navigateToItem(screenReader, /actions/i);
      await screenReader.clearSpokenPhraseLog();

      if (activation === 'Enter') {
        await screenReader.press('Enter');
      } else {
        await screenReader.act();
      }

      const input = page.getByRole('searchbox', { name: 'Filter actions' });
      await expect(input).toBeFocused();
      const firstItem = page.getByRole('menuitem', { name: 'New file', exact: true });
      await expect(input).toHaveAttribute(
        'aria-activedescendant',
        await firstItem.getAttribute('id'),
      );

      // capture:true waits for a quiet speech interval and includes every announcement from the
      // action. A later menu announcement must not cancel the highlighted item's speech.
      const openingSpeech = await screenReader.lastSpokenPhrase();
      expect(openingSpeech).toMatch(/new file/i);
      expect(openingSpeech).not.toMatch(/new file[\s\S]*actions[,\s]+menu\b/i);

      // The input participates in the navigation loop even though the menu opens on an item.
      await screenReader.press('ArrowUp');
      await expect(input).not.toHaveAttribute('aria-activedescendant');
      expect(await screenReader.lastSpokenPhrase()).toMatch(/filter actions.*(?:edit|search)/i);

      await screenReader.press('ArrowUp');
      expect(await screenReader.lastSpokenPhrase()).toMatch(/keep available offline/i);

      await screenReader.press('ArrowDown');
      await expect(input).not.toHaveAttribute('aria-activedescendant');
      expect(await screenReader.lastSpokenPhrase()).toMatch(/filter actions.*(?:edit|search)/i);

      await screenReader.type('Save');
      await expect(input).toHaveValue('Save');
      await expect(page.getByRole('menuitem', { name: 'New file', exact: true })).toBeHidden();

      await screenReader.press('ArrowDown');
      expect(await screenReader.lastSpokenPhrase()).toMatch(/\bsave(?:,|$)/i);

      await screenReader.press('Escape');
      await expect(page.getByRole('button', { name: 'Actions' })).toBeFocused();
    });
  }
}

test('announces the first submenu action and its filter input in the navigation loop', async ({
  page,
  screenReader,
}) => {
  await page.goto('/e2e-fixtures/menu/Filter#no-dev');
  await page.locator('[data-testid="testcase"]:not([aria-busy="true"])').waitFor();
  await screenReader.navigateToWebContent();
  await navigateToItem(screenReader, /actions/i);
  await screenReader.press('Enter');
  await screenReader.type('Move');
  await screenReader.press('ArrowDown');
  await screenReader.press('ArrowRight');

  const input = page.getByRole('searchbox', { name: 'Filter folders' });
  await expect(input).toBeFocused();
  const openingSpeech = await screenReader.lastSpokenPhrase();
  expect(openingSpeech).toMatch(/desktop/i);
  expect(openingSpeech).not.toMatch(/desktop[\s\S]*move to folder[,\s]+menu\b/i);

  await screenReader.press('ArrowUp');
  await expect(input).not.toHaveAttribute('aria-activedescendant');
  expect(await screenReader.lastSpokenPhrase()).toMatch(/filter folders.*(?:edit|search)/i);

  await screenReader.type('Projects');
  await expect(input).toHaveValue('Projects');
  await screenReader.press('ArrowDown');
  expect(await screenReader.lastSpokenPhrase()).toMatch(/projects/i);

  await screenReader.press('Escape');
  await expect(page.getByRole('searchbox', { name: 'Filter actions' })).toBeFocused();
});

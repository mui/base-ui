import { expect } from '@playwright/test';
import { screenReaderTest as test } from '@guidepup/playwright';

test.use({ screenReaderStartOptions: { capture: true } });

test('announces toast title and description once at each priority', async ({
  page,
  screenReader,
}) => {
  await page.goto('/e2e-fixtures/ToastAnnouncements#no-dev');
  await page.locator('[data-testid="testcase"]:not([aria-busy="true"])').waitFor();
  await screenReader.navigateToWebContent();
  await screenReader.clearSpokenPhraseLog();
  await page.getByRole('button', { name: 'Add polite toast' }).click();
  await expect
    .poll(async () => (await screenReader.spokenPhraseLog()).join(' '))
    .toContain('Changes saved');
  await expect
    .poll(async () => (await screenReader.spokenPhraseLog()).join(' '))
    .toContain('Changes saved Your document is up to date');
  const politeSpeech = (await screenReader.spokenPhraseLog()).join(' ');
  expect(politeSpeech.match(/Changes saved/g)).toHaveLength(1);
  expect(politeSpeech.match(/Your document is up to date/g)).toHaveLength(1);
  await expect(page.locator('[role="status"][aria-live="polite"]')).toContainText('Changes saved');

  await screenReader.clearSpokenPhraseLog();
  await page.getByRole('button', { name: 'Add urgent toast' }).click();
  await expect
    .poll(async () => (await screenReader.spokenPhraseLog()).join(' '))
    .toContain('Upload failed');
  await expect
    .poll(async () => (await screenReader.spokenPhraseLog()).join(' '))
    .toContain('Upload failed Please try again');
  const urgentSpeech = (await screenReader.spokenPhraseLog()).join(' ');
  expect(urgentSpeech.match(/Upload failed/g)).toHaveLength(1);
  expect(urgentSpeech.match(/Please try again/g)).toHaveLength(1);
  await expect(page.locator('[role="status"][aria-live="assertive"]')).toContainText(
    'Upload failed',
  );
});

test('announces promise completion', async ({ page, screenReader }) => {
  await page.goto('/e2e-fixtures/ToastAnnouncements#no-dev');
  await page.locator('[data-testid="testcase"]:not([aria-busy="true"])').waitFor();
  await screenReader.navigateToWebContent();
  await screenReader.clearSpokenPhraseLog();
  await page.getByRole('button', { name: 'Start upload' }).click();
  await expect
    .poll(async () => (await screenReader.spokenPhraseLog()).join(' '))
    .toContain('Uploading document');
  await screenReader.clearSpokenPhraseLog();
  await page.getByRole('button', { name: 'Finish upload' }).click();
  await expect
    .poll(async () => (await screenReader.spokenPhraseLog()).join(' '))
    .toContain('Document uploaded');
});

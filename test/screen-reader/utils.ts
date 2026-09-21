import type { ScreenReaderPlaywright } from '@guidepup/playwright';

const MAX_NAVIGATION_STEPS = 10;

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

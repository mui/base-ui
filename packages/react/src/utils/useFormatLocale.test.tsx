import { expect, describe, it } from 'vitest';
import * as React from 'react';
import { createRenderer } from '#test-utils';
import { useFormatLocale } from './useFormatLocale';

describe('useFormatLocale', () => {
  const { render, renderToString } = createRenderer({ strict: false });

  it('returns the runtime locale on the first client-only render', async () => {
    const locales: Array<Intl.LocalesArgument | undefined> = [];

    function TestComponent() {
      locales.push(useFormatLocale(undefined));
      return null;
    }

    await render(<TestComponent />);

    expect(locales).toEqual([undefined]);
  });

  it.each([
    { name: 'en-US until hydrated without a locale', locale: undefined, hydrated: undefined },
    { name: 'the passed locale while hydrating', locale: 'fr-FR', hydrated: 'fr-FR' },
  ])('returns $name', async ({ locale, hydrated }) => {
    const hydrating = locale ?? 'en-US';
    const locales: Array<Intl.LocalesArgument | undefined> = [];

    function TestComponent() {
      locales.push(useFormatLocale(locale));
      return null;
    }

    const { hydrate } = await renderToString(<TestComponent />);
    expect(locales).toEqual([hydrating]);

    locales.length = 0;
    await hydrate();
    expect(locales[0]).toBe(hydrating);
    expect(locales.at(-1)).toBe(hydrated);
  });
});

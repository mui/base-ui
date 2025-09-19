'use client';
import * as React from 'react';
import { Locale } from 'date-fns/locale';

export type TemporalLocaleContext = {
  locale?: Locale;
};

/**
 * @internal
 */
export const TemporalLocaleContext = React.createContext<TemporalLocaleContext | undefined>(
  undefined,
);

export function useTemporalLocale() {
  const context = React.useContext(TemporalLocaleContext);
  if (context === undefined) {
    throw new Error(
      [
        'Base UI: TemporalLocaleContext is missing.',
        'Temporal components must be place within <TemporalLocaleProvider />',
      ].join('\n'),
    );
  }

  return context.locale;
}

'use client';
import * as React from 'react';
import { Locale } from 'date-fns/locale';

export type LocalizationContext = {
  temporalLocale?: Locale | undefined;
};

/**
 * @internal
 */
export const LocalizationContext = React.createContext<LocalizationContext | undefined>(undefined);

export function useTemporalLocale() {
  const context = React.useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: LocalizationContext is missing. Temporal components must be place within <LocalizationProvider />',
    );
  }

  return context.temporalLocale;
}

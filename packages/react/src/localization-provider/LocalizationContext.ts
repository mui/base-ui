'use client';
import * as React from 'react';
import { Locale } from 'date-fns/locale';

export type LocalizationContext = {
  dateLocale?: Locale | undefined;
};

/**
 * @internal
 */
export const LocalizationContext = React.createContext<LocalizationContext | undefined>(undefined);

export function useDateLocale() {
  const context = React.useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: LocalizationContext is missing. Temporal components must be place within <LocalizationProvider />',
    );
  }

  return context.dateLocale;
}

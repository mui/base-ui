'use client';
import * as React from 'react';
import { Locale } from 'date-fns/locale';
import type { BaseUITranslations } from '../translations/types';
import { enUS } from '../translations/enUS';

export type LocalizationContext = {
  temporalLocale?: Locale | undefined;
  translations: BaseUITranslations;
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

export function useTranslations(): BaseUITranslations {
  const context = React.useContext(LocalizationContext);
  if (context === undefined) {
    return enUS;
  }

  return context.translations;
}

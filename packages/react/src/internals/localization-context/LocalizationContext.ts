'use client';
import * as React from 'react';
import { enUS } from '../../locale-enUS';
import type { LocalizationProviderTranslations } from '../../localization-provider/types';

export const LocalizationContext = React.createContext<LocalizationProviderTranslations>(enUS);

/**
 * Returns the translations from the nearest Localization Provider.
 * @internal
 */
export function useTranslations(): LocalizationProviderTranslations {
  return React.useContext(LocalizationContext);
}

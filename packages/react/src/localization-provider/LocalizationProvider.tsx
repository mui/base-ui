'use client';
import * as React from 'react';
import { fastObjectShallowCompare } from '@base-ui/utils/fastObjectShallowCompare';
import { LocalizationContext } from '../internals/localization-context/LocalizationContext';
import type { LocalizationProviderTranslations } from './types';

/**
 * Provides translated strings for Base UI components.
 *
 * Documentation: [Base UI Localization Provider](https://base-ui.com/react/utils/localization-provider)
 */
export function LocalizationProvider(props: LocalizationProvider.Props) {
  const { children, translations } = props;
  const parentTranslations = React.useContext(LocalizationContext);

  // Ignore explicitly undefined entries so a partial override cannot erase a
  // required inherited translation callback.
  let mergedTranslations = parentTranslations;
  if (translations) {
    mergedTranslations = { ...parentTranslations };
    const target = mergedTranslations as unknown as Record<string, unknown>;
    for (const [key, value] of Object.entries(translations)) {
      if (value !== undefined) {
        target[key] = value;
      }
    }
  }

  // Inline translation objects commonly change identity on every render. Keep
  // the context stable while their contents remain shallowly equal.
  const mergedRef = React.useRef(mergedTranslations);
  if (!fastObjectShallowCompare(mergedRef.current, mergedTranslations)) {
    mergedRef.current = mergedTranslations;
  }

  return (
    <LocalizationContext.Provider value={mergedRef.current}>
      {children}
    </LocalizationContext.Provider>
  );
}

export interface LocalizationProviderState {}

export interface LocalizationProviderProps {
  children?: React.ReactNode;
  /**
   * Translations for Base UI-owned labels, instructions, and announcements.
   * Partial objects are merged with the inherited translations.
   * @default enUS
   */
  translations?: Partial<LocalizationProviderTranslations> | undefined;
}

export namespace LocalizationProvider {
  export type State = LocalizationProviderState;
  export type Props = LocalizationProviderProps;
  export type Translations = LocalizationProviderTranslations;
}

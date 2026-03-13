'use client';
import * as React from 'react';
import { Locale } from 'date-fns/locale';
import { LocalizationContext } from './LocalizationContext';
import { TemporalAdapterDateFns } from '../temporal-adapter-date-fns/TemporalAdapterDateFns';
import { TemporalAdapterContext } from '../temporal-adapter-provider/TemporalAdapterContext';
import type { BaseUITranslations } from '../translations/types';
import { enUS } from '../translations/enUS';

/**
 * Defines the temporal locale provider for Base UI temporal components.
 *
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Localization Provider](https://base-ui.com/react/utils/localization-provider)
 */
export const LocalizationProvider: React.FC<LocalizationProvider.Props> =
  function LocalizationProvider(props: LocalizationProvider.Props) {
    const { children, temporalLocale, translations } = props;

    const contextValue = React.useMemo(
      () => ({
        temporalLocale,
        translations: translations ? { ...enUS, ...translations } : enUS,
      }),
      [temporalLocale, translations],
    );
    const adapterContextValue = React.useMemo(
      () => ({ adapter: new TemporalAdapterDateFns({ locale: temporalLocale }) }),
      [temporalLocale],
    );

    return (
      <LocalizationContext.Provider value={contextValue}>
        <TemporalAdapterContext.Provider value={adapterContextValue}>
          {children}
        </TemporalAdapterContext.Provider>
      </LocalizationContext.Provider>
    );
  };

export namespace LocalizationProvider {
  export interface Props {
    children?: React.ReactNode;
    /**
     * The locale to use in temporal components.
     * @default en-US
     */
    temporalLocale?: Locale | undefined;
    /**
     * Translations for Base UI component labels.
     * Partial objects are merged with the default English translations.
     * @default enUS
     */
    translations?: Partial<BaseUITranslations> | undefined;
  }
}

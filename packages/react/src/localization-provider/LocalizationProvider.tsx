'use client';
import * as React from 'react';
import { Locale } from 'date-fns/locale';
import { LocalizationContext } from './LocalizationContext';
import { TemporalAdapterDateFns } from '../temporal-adapter-date-fns/TemporalAdapterDateFns';
import { TemporalAdapterContext } from '../temporal-adapter-provider/TemporalAdapterContext';

/**
 * Defines the date locale provider for Base UI temporal components.
 */
export const LocalizationProvider: React.FC<LocalizationProvider.Props> =
  function LocalizationProvider(props: LocalizationProvider.Props) {
    const { children, dateLocale } = props;

    const contextValue = React.useMemo(() => ({ dateLocale }), [dateLocale]);
    const adapterContextValue = React.useMemo(
      () => ({ adapter: new TemporalAdapterDateFns({ locale: dateLocale }) }),
      [dateLocale],
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
    dateLocale?: Locale | undefined;
  }
}

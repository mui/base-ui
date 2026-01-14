'use client';
import * as React from 'react';
import { Locale } from 'date-fns/locale';
import { TemporalLocaleContext } from './TemporalLocaleContext';
import { TemporalAdapterDateFns } from '../temporal-adapter-date-fns/TemporalAdapterDateFns';
import { TemporalAdapterContext } from '../temporal-adapter-provider/TemporalAdapterContext';

/**
 * Defines the date locale provider for Base UI temporal components.
 */
export const TemporalLocaleProvider: React.FC<TemporalLocaleProvider.Props> =
  function TemporalLocaleProvider(props: TemporalLocaleProvider.Props) {
    const { children, locale } = props;

    const contextValue = React.useMemo(() => ({ locale }), [locale]);
    const adapterContextValue = React.useMemo(
      () => ({ adapter: new TemporalAdapterDateFns({ locale }) }),
      [locale],
    );

    return (
      <TemporalLocaleContext.Provider value={contextValue}>
        <TemporalAdapterContext.Provider value={adapterContextValue}>
          {children}
        </TemporalAdapterContext.Provider>
      </TemporalLocaleContext.Provider>
    );
  };

export namespace TemporalLocaleProvider {
  export interface Props {
    children?: React.ReactNode;
    /**
     * The locale to use in temporal components.
     * @default en-US
     */
    locale?: Locale;
  }
}

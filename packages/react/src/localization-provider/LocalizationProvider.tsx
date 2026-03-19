'use client';
import * as React from 'react';
import { Locale } from 'date-fns/locale';
import { LocalizationContext } from './LocalizationContext';
import { TemporalAdapterDateFns } from '../temporal-adapter-date-fns/TemporalAdapterDateFns';
import { TemporalAdapterContext } from '../temporal-adapter-provider/TemporalAdapterContext';

/**
 * Defines the temporal locale provider for Base UI temporal components.
 *
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Localization Provider](https://base-ui.com/react/utils/localization-provider)
 */
export const LocalizationProvider: React.FC<LocalizationProvider.Props> =
  function LocalizationProvider(props: LocalizationProvider.Props) {
    const { children, temporalLocale } = props;

    const contextValue = React.useMemo(() => ({ temporalLocale }), [temporalLocale]);
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
  }
}

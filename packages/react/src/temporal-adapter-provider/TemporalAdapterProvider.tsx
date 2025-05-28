'use client';
import * as React from 'react';
import { TemporalAdapter } from '../models';
import { TemporalAdapterContext } from './TemporalAdapterContext';

/**
 * Defines the date library adapter for Base UI temporal components.
 */
export const TemporalAdapterProvider = function DateAdapterProvider<TLocale>(
  props: TemporalAdapterProvider.Props<TLocale>,
) {
  const { children, value: AdapterClass, locale } = props;

  const contextValue = React.useMemo(
    () => ({ adapter: new AdapterClass({ locale }) }),
    [AdapterClass, locale],
  );

  return (
    <TemporalAdapterContext.Provider value={contextValue}>
      {children}
    </TemporalAdapterContext.Provider>
  );
};

export namespace TemporalAdapterProvider {
  export interface Props<TLocale> {
    children?: React.ReactNode;
    /**
     * The date library adapter class.
     */
    value: new (...args: any) => TemporalAdapter<TLocale>;
    /**
     * Locale for the date library being used.
     */
    locale?: TLocale;
  }
}

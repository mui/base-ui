'use client';
import * as React from 'react';
import { DateAdapter } from '../models';
import { DateAdapterContext } from './DateAdapterContext';

/**
 * Defines the date library adapter for Base UI date and time components.
 */
export const DateAdapterProvider = function DateAdapterProvider<TLocale>(
  props: DateAdapterProvider.Props<TLocale>,
) {
  const { children, value: AdapterClass, locale } = props;

  const contextValue = React.useMemo(
    () => ({ adapter: new AdapterClass({ locale }) }),
    [AdapterClass, locale],
  );

  return <DateAdapterContext.Provider value={contextValue}>{children}</DateAdapterContext.Provider>;
};

export namespace DateAdapterProvider {
  export interface Props<TLocale> {
    children?: React.ReactNode;
    /**
     * The date library adapter class.
     */
    value: new (...args: any) => DateAdapter<TLocale>;
    /**
     * Locale for the date library being used.
     */
    locale?: TLocale;
  }
}

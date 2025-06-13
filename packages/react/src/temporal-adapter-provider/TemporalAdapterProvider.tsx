'use client';
import * as React from 'react';
import { TemporalAdapter } from '../models';
import { TemporalAdapterContext } from './TemporalAdapterContext';

/**
 * Defines the date library adapter for Base UI temporal components.
 */
export const TemporalAdapterProvider: React.FC<TemporalAdapterProvider.Props> =
  function DateAdapterProvider(props: TemporalAdapterProvider.Props) {
    const { children, adapter } = props;

    const contextValue = React.useMemo(() => ({ adapter }), [adapter]);

    return (
      <TemporalAdapterContext.Provider value={contextValue}>
        {children}
      </TemporalAdapterContext.Provider>
    );
  };

export namespace TemporalAdapterProvider {
  export interface Props {
    children?: React.ReactNode;
    /**
     * The date library adapter.
     */
    adapter: TemporalAdapter;
  }
}

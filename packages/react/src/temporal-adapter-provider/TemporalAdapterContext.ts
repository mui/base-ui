'use client';
import * as React from 'react';
import { TemporalAdapter } from '../types/temporal-adapter';
import { TemporalAdapterDateFns } from '../temporal-adapter-date-fns/TemporalAdapterDateFns';

export type TemporalAdapterContext = {
  adapter: TemporalAdapter;
};

/**
 * @internal
 */
export const TemporalAdapterContext = React.createContext<TemporalAdapterContext | undefined>({
  adapter: new TemporalAdapterDateFns(),
});

export function useTemporalAdapter() {
  const context = React.useContext(TemporalAdapterContext);
  if (context === undefined) {
    throw new Error(
      [
        'Base UI: TemporalAdapterContext is missing.',
        'Temporal components must be place within <TemporalAdapterProvider />',
      ].join('\n'),
    );
  }

  return context.adapter;
}

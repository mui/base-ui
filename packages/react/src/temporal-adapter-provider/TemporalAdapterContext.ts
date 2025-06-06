'use client';
import * as React from 'react';
import { TemporalAdapter } from '../models/temporal-adapter';

export type TemporalAdapterContext = {
  adapter: TemporalAdapter;
};

/**
 * @internal
 */
export const TemporalAdapterContext = React.createContext<TemporalAdapterContext | undefined>(
  undefined,
);

export function useTemporalAdapter() {
  const context = React.useContext(TemporalAdapterContext);
  if (context === undefined) {
    throw new Error(
      [
        'Base UI: TemporalAdapterContext is missing.',
        'Calendar parts must be place within <TemporalAdapterProvider />',
      ].join('\n'),
    );
  }

  return context.adapter;
}

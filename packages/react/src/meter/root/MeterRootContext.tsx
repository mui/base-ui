'use client';
import * as React from 'react';
import type { MeterRoot } from './MeterRoot';
import type { useMeterRoot } from './useMeterRoot';

export type MeterRootContext = Omit<useMeterRoot.ReturnValue, 'getRootProps'> & {
  state: MeterRoot.State;
};

/**
 * @ignore - internal component.
 */
export const MeterRootContext = React.createContext<MeterRootContext | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  MeterRootContext.displayName = 'MeterRootContext';
}

export function useMeterRootContext() {
  const context = React.useContext(MeterRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: MeterRootContext is missing. Meter parts must be placed within <Meter.Root>.',
    );
  }

  return context;
}

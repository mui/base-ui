'use client';
import * as React from 'react';
import type { MeterRoot } from './MeterRoot';

export type MeterRootContext = {
  formattedValue: string;
  max: number;
  min: number;
  percentageValue: number;
  setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
  state: MeterRoot.State;
  value: number;
};

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

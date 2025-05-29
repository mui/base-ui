'use client';
import * as React from 'react';

export type MeterRootContext = {
  formattedValue: string;
  max: number;
  min: number;
  percentageValue: number;
  setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
  value: number;
};

export const MeterRootContext = React.createContext<MeterRootContext | undefined>(undefined);

export function useMeterRootContext() {
  const context = React.useContext(MeterRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: MeterRootContext is missing. Meter parts must be placed within <Meter.Root>.',
    );
  }

  return context;
}

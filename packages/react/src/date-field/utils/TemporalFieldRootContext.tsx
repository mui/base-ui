'use client';
import * as React from 'react';
import { TemporalFieldStore } from './TemporalFieldStore';

export type TemporalFieldRootContext = TemporalFieldStore<any>;

export const TemporalFieldRootContext = React.createContext<TemporalFieldRootContext | undefined>(
  undefined,
);

export function useTemporalFieldRootContext() {
  const context = React.useContext(TemporalFieldRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: TemporalFieldRootContext is missing. Temporal Field parts must be placed within <DateField.Root />, <TimeField.Root /> or <DateTimeField.Root />.',
    );
  }
  return context;
}

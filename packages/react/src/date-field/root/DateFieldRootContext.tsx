'use client';
import * as React from 'react';
import { TemporalValue } from '../../types';
import { TemporalFieldStore } from '../utils/TemporalFieldStore';

export type DateFieldRootContext = TemporalFieldStore<TemporalValue>;

export const DateFieldRootContext = React.createContext<DateFieldRootContext | undefined>(
  undefined,
);

export function useDateFieldRootContext() {
  const context = React.useContext(DateFieldRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: DateFieldRootContext is missing. DateField parts must be placed within <DateField.Root />, <TimeField.Root /> or <DateTimeField.Root />.',
    );
  }
  return context;
}

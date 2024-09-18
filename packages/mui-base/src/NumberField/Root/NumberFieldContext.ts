'use client';
import * as React from 'react';
import { NumberFieldContextValue } from './NumberFieldRoot.types';

export const NumberFieldContext = React.createContext<NumberFieldContextValue | null>(null);

if (process.env.NODE_ENV !== 'production') {
  NumberFieldContext.displayName = 'NumberFieldContext';
}

type Part = 'Group' | 'Input' | 'Increment' | 'Decrement' | 'ScrubArea' | 'ScrubAreaCursor';

export function useNumberFieldContext(part: Part) {
  const context = React.useContext(NumberFieldContext);
  if (context === null) {
    throw new Error(`Base UI: NumberField${part} is not placed inside the NumberField component.`);
  }
  return context;
}

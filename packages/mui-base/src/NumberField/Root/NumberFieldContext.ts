'use client';
import * as React from 'react';
import type { UseNumberFieldRoot } from './useNumberFieldRoot';
import type { NumberFieldRoot } from './NumberFieldRoot';

export interface NumberFieldContext extends UseNumberFieldRoot.ReturnValue {
  ownerState: NumberFieldRoot.OwnerState;
}

export const NumberFieldContext = React.createContext<NumberFieldContext | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  NumberFieldContext.displayName = 'NumberFieldContext';
}

type Part = 'Group' | 'Input' | 'Increment' | 'Decrement' | 'ScrubArea' | 'ScrubAreaCursor';

export function useNumberFieldContext(part: Part) {
  const context = React.useContext(NumberFieldContext);
  if (context === undefined) {
    throw new Error(
      `Base UI: NumberFieldContext is not defined. NumberField${part} is not placed inside the NumberField component.`,
    );
  }

  return context;
}

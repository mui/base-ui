import * as React from 'react';
import type { UseNumberFieldReturnValue } from '../useNumberField/useNumberField.types';
import { OwnerState } from './NumberField.types';

export type NumberFieldContextValue = UseNumberFieldReturnValue & {
  ownerState: OwnerState;
};

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

import * as React from 'react';
import type { useSelectPositioner } from './useSelectPositioner';

export type SelectPositionerContext = useSelectPositioner.ReturnValue;

export const SelectPositionerContext = React.createContext<SelectPositionerContext | null>(null);

export function useSelectPositionerContext() {
  const context = React.useContext(SelectPositionerContext);
  if (context === null) {
    throw new Error(
      'Base UI: SelectPositionerContext is missing. SelectPositioner parts must be placed within <Select.Positioner>.',
    );
  }
  return context;
}

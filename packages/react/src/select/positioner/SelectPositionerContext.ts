import * as React from 'react';
import type { useSelectPositioner } from './useSelectPositioner';

export type SelectPositionerContext = useSelectPositioner.ReturnValue & {
  alignItemWithTriggerActive: boolean;
  controlledItemAnchor: boolean;
  setControlledItemAnchor: React.Dispatch<React.SetStateAction<boolean>>;
  scrollUpArrowVisible: boolean;
  setScrollUpArrowVisible: React.Dispatch<React.SetStateAction<boolean>>;
  scrollDownArrowVisible: boolean;
  setScrollDownArrowVisible: React.Dispatch<React.SetStateAction<boolean>>;
};

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

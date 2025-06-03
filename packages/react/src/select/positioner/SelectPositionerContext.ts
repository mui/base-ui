import * as React from 'react';
import type { useSelectPositioner } from './useSelectPositioner';
import { throwMissingContextError } from '../../utils/errorHelper';

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
    return throwMissingContextError(
      'SelectPositionerContext',
      'SelectPositioner',
      'Select.Positioner',
    );
  }
  return context;
}

import * as React from 'react';
import { type Side, useAnchorPositioning } from '../../utils/useAnchorPositioning';

export interface SelectPositionerContext extends Omit<useAnchorPositioning.ReturnValue, 'side'> {
  side: 'none' | Side;
  alignItemWithTriggerActive: boolean;
  setControlledAlignItemWithTrigger: React.Dispatch<React.SetStateAction<boolean>>;
  scrollArrows: 'auto' | 'always';
}

export const SelectPositionerContext = React.createContext<SelectPositionerContext | undefined>(
  undefined,
);

export function useSelectPositionerContext() {
  const context = React.useContext(SelectPositionerContext);
  if (!context) {
    throw new Error(
      'Base UI: SelectPositionerContext is missing. SelectPositioner parts must be placed within <Select.Positioner>.',
    );
  }
  return context;
}

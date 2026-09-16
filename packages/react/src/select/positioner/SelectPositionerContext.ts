'use client';
import * as React from 'react';
import type { Side, UseAnchorPositioningReturnValue } from '../../internals/useAnchorPositioning';

export interface SelectPositionerContext extends Omit<UseAnchorPositioningReturnValue, 'side'> {
  side: 'none' | Side;
  alignItemWithTriggerActive: boolean;
  /**
   * Whether `alignItemWithTrigger` was passed as `true` rather than left at its default.
   *
   * A virtualizer turns the mode off, which is silent for the default but worth reporting when it
   * contradicts something the application asked for.
   */
  alignItemWithTriggerExplicit: boolean;
  setControlledAlignItemWithTrigger: React.Dispatch<React.SetStateAction<boolean>>;
  scrollUpArrowRef: React.RefObject<HTMLDivElement | null>;
  scrollDownArrowRef: React.RefObject<HTMLDivElement | null>;
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

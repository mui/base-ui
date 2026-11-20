'use client';
import * as React from 'react';
import type { Side, UseAnchorPositioningReturnValue } from '../../internals/useAnchorPositioning';

export interface SelectPositionerContext extends Omit<UseAnchorPositioningReturnValue, 'side'> {
  side: 'none' | Side;
  alignItemWithTriggerActive: boolean;
  setControlledAlignItemWithTrigger: React.Dispatch<React.SetStateAction<boolean>>;
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

/**
 * What the scroll arrows read from the positioner. Separate from `SelectPositionerContext`, whose
 * value changes with every position update, so that a hidden arrow doesn't re-render on those.
 */
export interface SelectScrollArrowContext {
  side: 'none' | Side;
  scrollUpArrowRef: React.RefObject<HTMLDivElement | null>;
  scrollDownArrowRef: React.RefObject<HTMLDivElement | null>;
}

export const SelectScrollArrowContext = React.createContext<SelectScrollArrowContext | undefined>(
  undefined,
);

export function useSelectScrollArrowContext() {
  const context = React.useContext(SelectScrollArrowContext);
  if (!context) {
    throw new Error(
      'Base UI: SelectPositionerContext is missing. SelectPositioner parts must be placed within <Select.Positioner>.',
    );
  }
  return context;
}

'use client';
import * as React from 'react';
import type { Orientation } from '../utils/types';
import type { BaseUIChangeEventDetails } from '../utils/createBaseUIEventDetails';
import type { BaseUIEventReasons } from '../utils/reasons';

export interface ToggleGroupContext<Value> {
  value: readonly Value[];
  setGroupValue: (
    newValue: Value,
    nextPressed: boolean,
    eventDetails: BaseUIChangeEventDetails<BaseUIEventReasons['none']>,
  ) => void;
  disabled: boolean;
  orientation: Orientation;
  isValueInitialized: boolean;
}

export const ToggleGroupContext = React.createContext<ToggleGroupContext<any> | undefined>(
  undefined,
);

export function useToggleGroupContext<Value>(optional = true) {
  const context = React.useContext<ToggleGroupContext<Value> | undefined>(ToggleGroupContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: ToggleGroupContext is missing. ToggleGroup parts must be placed within <ToggleGroup>.',
    );
  }

  return context;
}

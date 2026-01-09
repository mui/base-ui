'use client';
import * as React from 'react';
import type { Orientation } from '../utils/types';
import type { BaseUIChangeEventDetails } from '../utils/createBaseUIEventDetails';
import type { BaseUIEventReasons } from '../utils/reasons';

export interface ToggleGroupContext<Value> {
  value: Value[];
  setGroupValue: (
    newValue: Value,
    nextPressed: boolean,
    eventDetails: BaseUIChangeEventDetails<BaseUIEventReasons['none']>,
  ) => void;
  disabled: boolean;
  orientation: Orientation;
}

export const ToggleGroupContext = React.createContext<ToggleGroupContext<unknown> | undefined>(
  undefined,
);

export function useToggleGroupContext<Value>(optional = true) {
  const context = React.useContext(ToggleGroupContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: ToggleGroupContext is missing. ToggleGroup parts must be placed within <ToggleGroup>.',
    );
  }

  return context as ToggleGroupContext<Value>;
}

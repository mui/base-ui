'use client';
import * as React from 'react';
import type { Orientation } from '../utils/types';
import { throwMissingContextError } from '../utils/errorHelper';

export interface ToggleGroupContext {
  value: readonly any[];
  setGroupValue: (newValue: string, nextPressed: boolean, event: Event) => void;
  disabled: boolean;
  orientation: Orientation;
}

export const ToggleGroupContext = React.createContext<ToggleGroupContext | undefined>(undefined);

export function useToggleGroupContext(optional = true) {
  const context = React.useContext(ToggleGroupContext);
  if (context === undefined && !optional) {
    return throwMissingContextError('ToggleGroupContext', 'ToggleGroup', 'ToggleGroup');
  }

  return context;
}

'use client';
import * as React from 'react';
import type { ProgressRootState } from './ProgressRoot';

export type ProgressRootContext = {
  /**
   * Formatted value of the component.
   */
  formattedValue: string;
  /**
   * The value normalized to a `0`–`100` percentage of the range, clamped to those bounds.
   * `null` while the progress is indeterminate.
   */
  percentageValue: number | null;
  /**
   * Value of the component.
   */
  value: number | null;
  setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
  state: ProgressRootState;
};

/**
 * @internal
 */
export const ProgressRootContext = React.createContext<ProgressRootContext | undefined>(undefined);

export function useProgressRootContext() {
  const context = React.useContext(ProgressRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: ProgressRootContext is missing. Progress parts must be placed within <Progress.Root>.',
    );
  }

  return context;
}

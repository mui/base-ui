'use client';
import * as React from 'react';
import type { ProgressRoot, ProgressStatus } from './ProgressRoot';

export type ProgressRootContext = {
  /**
   * The maximum value.
   */
  max: number;
  /**
   * The minimum value.
   */
  min: number;
  /**
   * Value of the component.
   */
  value: number | null;
  /**
   * Formatted value of the component.
   */
  formattedValue: string;
  status: ProgressStatus;
  state: ProgressRoot.State;
};

/**
 * @ignore - internal component.
 */
export const ProgressRootContext = React.createContext<ProgressRootContext | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  ProgressRootContext.displayName = 'ProgressRootContext';
}

export function useProgressRootContext() {
  const context = React.useContext(ProgressRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: ProgressRootContext is missing. Progress parts must be placed within <Progress.Root>.',
    );
  }

  return context;
}

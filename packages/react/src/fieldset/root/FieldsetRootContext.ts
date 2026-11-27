'use client';
import * as React from 'react';

export interface FieldsetRootContext {
  /**
   * The `id` of the legend, resolved so it is already correct in server-rendered markup.
   * `undefined` once registration has settled without a legend.
   */
  legendId: string | undefined;
  /**
   * The `id` the root generated for its legend. `Fieldset.Legend` renders it until its own
   * registration runs, so the server markup keeps the root and the legend associated.
   */
  defaultLegendId: string | undefined;
  setLegendId: React.Dispatch<React.SetStateAction<string | undefined>>;
  disabled: boolean;
}

export const FieldsetRootContext = React.createContext<FieldsetRootContext | undefined>(undefined);

export function useFieldsetRootContext(optional: true): FieldsetRootContext | undefined;
export function useFieldsetRootContext(optional?: false): FieldsetRootContext;
export function useFieldsetRootContext(optional = false) {
  const context = React.useContext(FieldsetRootContext);
  if (!context && !optional) {
    throw new Error(
      'Base UI: FieldsetRootContext is missing. Fieldset parts must be placed within <Fieldset.Root>.',
    );
  }
  return context;
}
